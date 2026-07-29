# Parts Item Status Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce per-line admin work on a parts order to two toggles (backorder, refund) by deriving line completion from the order status, and make the backorder hold clock count from the order date rather than from when an operator pressed a button.

**Architecture:** `PartsOrderItem.status` drops to two stored values (`to_order`, `refunded`); a third wire value, `completed`, is derived in the serializer from `PartsOrder.status == 'completed'` and never stored, so there is exactly one write path between order and items (the existing items→order `recompute_rollup`). The backorder hold is a promise about the customer's *total* wait, so it is computed from `PartsOrder.created_at` — which makes it a property of the order, not of each line, letting `PartsOrderItem.backorder_since` be deleted entirely.

**Tech Stack:** Django 5 + Django REST Framework, pytest + pytest-django (`pytest.ini` at repo root, `DJANGO_SETTINGS_MODULE=allbikes.settings`), Next.js App Router frontend with TypeScript.

## Global Constraints

- `USE_TZ = True`, `TIME_ZONE = "Australia/Perth"` (`allbikes/settings.py:167,171`). Any date arithmetic on `created_at` MUST go through `django.utils.timezone` — use `timezone.localtime(dt).date()` and `timezone.localdate()`, never `date.today()` or `.date()` on a raw UTC datetime.
- Latest existing migration is `parts/migrations/0004_remove_partssettings_domestic_shipping_fee_and_more.py`. The new migration is `0005`.
- Run backend tests with `python -m pytest <path> -v` from the repo root.
- The frontend has **no test suite**. Frontend tasks are verified with `cd frontend && npx tsc --noEmit` and `npm run lint`.
- Item status wire values are exactly `to_order` | `completed` | `refunded`. Order status wire values are exactly `pending_payment` | `paid` | `dispatched` | `completed` | `cancelled` | `refunded` | `partially_refunded`.
- **Accepted product decision:** placing a line on backorder is *hard-blocked* once the order is older than `PartsSettings.backorder_hold_days`. The known tradeoff — accepted by the product owner — is that between discovering a part is unavailable and processing the Stripe refund, that line reads `to order` with nothing marking it as a problem. Do not add a workaround state.
- **Accepted data decision:** this branch (`feature/sym-parts-platform`) is pre-launch. The data migration maps both legacy `ordered` and legacy `fulfilled` items to `to_order`. Historical per-line fulfilment is not preserved. If production data exists, STOP and raise it before running the migration.

---

### Task 1: Model status values and migration

**Files:**
- Modify: `parts/models/parts_order.py:21-28` (add `completed`), and add two methods after `recompute_rollup`
- Modify: `parts/models/parts_order_item.py:25-33` (status choices; delete `backorder_since`)
- Create: `parts/migrations/0005_parts_item_status_simplification.py`
- Test: `parts/tests/model_tests/test_parts_models.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `PartsOrder.STATUS_CHOICES` now contains `('completed', 'Completed')`.
  - `PartsOrderItem.STATUS_CHOICES == [('to_order', 'To Order'), ('refunded', 'Refunded')]`, default `'to_order'`.
  - `PartsOrderItem.backorder_since` no longer exists.
  - `PartsOrder.backorder_days_remaining(hold_days=None) -> int`
  - `PartsOrder.backorder_window_expired(hold_days=None) -> bool`

- [ ] **Step 1: Write the failing tests**

Append to `parts/tests/model_tests/test_parts_models.py`:

```python
from datetime import timedelta

from django.utils import timezone

from parts.models import PartsOrder, PartsOrderItem


def _bare_order(**over):
    """A saved PartsOrder with the minimum required fields."""
    base = {
        'customer_name': 'Jane Smith', 'customer_email': 'jane@example.com',
        'address_line1': '1 St', 'suburb': 'Perth', 'state': 'WA', 'postcode': '6000',
    }
    base.update(over)
    return PartsOrder.objects.create(**base)


def _age_order(order, days):
    """created_at is auto_now_add, so it can only be moved with a queryset update."""
    PartsOrder.objects.filter(pk=order.pk).update(
        created_at=timezone.now() - timedelta(days=days)
    )
    order.refresh_from_db()
    return order


class TestPartsOrderItemStatus:
    def test_defaults_to_to_order(self):
        order = _bare_order()
        item = order.items.create(
            part_number='A-1', quantity=1, unit_price=Decimal('10'), line_total=Decimal('10')
        )
        assert item.status == 'to_order'

    def test_status_choices_are_to_order_and_refunded(self):
        assert PartsOrderItem.STATUS_CHOICES == [
            ('to_order', 'To Order'),
            ('refunded', 'Refunded'),
        ]

    def test_backorder_since_field_is_gone(self):
        names = {f.name for f in PartsOrderItem._meta.get_fields()}
        assert 'backorder_since' not in names


class TestPartsOrderCompletedStatus:
    def test_completed_is_a_valid_order_status(self):
        assert ('completed', 'Completed') in PartsOrder.STATUS_CHOICES


class TestBackorderWindow:
    def test_full_window_on_the_day_the_order_is_placed(self):
        order = _bare_order()
        assert order.backorder_days_remaining(hold_days=14) == 14
        assert order.backorder_window_expired(hold_days=14) is False

    def test_clock_counts_from_the_order_date(self):
        order = _age_order(_bare_order(), days=5)
        assert order.backorder_days_remaining(hold_days=14) == 9
        assert order.backorder_window_expired(hold_days=14) is False

    def test_window_expired_exactly_on_the_boundary(self):
        order = _age_order(_bare_order(), days=14)
        assert order.backorder_days_remaining(hold_days=14) == 0
        assert order.backorder_window_expired(hold_days=14) is True

    def test_window_expired_past_the_boundary(self):
        order = _age_order(_bare_order(), days=20)
        assert order.backorder_days_remaining(hold_days=14) == -6
        assert order.backorder_window_expired(hold_days=14) is True

    def test_falls_back_to_settings_when_hold_days_not_supplied(self):
        s = PartsSettings.get()
        s.backorder_hold_days = 7
        s.save()
        assert _bare_order().backorder_days_remaining() == 7
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest parts/tests/model_tests/test_parts_models.py -v -k "Status or BackorderWindow"`

Expected: FAIL — `AttributeError: 'PartsOrder' object has no attribute 'backorder_days_remaining'`, and the choices/`completed` assertions fail.

- [ ] **Step 3: Add `completed` to the order status choices**

In `parts/models/parts_order.py`, replace the `STATUS_CHOICES` list (lines 21-28) with:

```python
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('dispatched', 'Dispatched'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
```

- [ ] **Step 4: Add the backorder window methods to `PartsOrder`**

Add this import at the top of `parts/models/parts_order.py`, below the existing `from django.db import models`:

```python
from django.utils import timezone
```

Add these two methods to `PartsOrder`, immediately after `recompute_rollup`:

```python
    def backorder_days_remaining(self, hold_days=None):
        """Days left in the backorder hold, counted from the order date.

        The hold is a promise about the customer's *total* wait, so the clock
        starts when they paid — not when an operator noticed a part was short.
        Can be zero or negative, meaning the window has closed.
        """
        if hold_days is None:
            from parts.models.parts_settings import PartsSettings
            hold_days = PartsSettings.get().backorder_hold_days
        ordered_on = timezone.localtime(self.created_at).date()
        return hold_days - (timezone.localdate() - ordered_on).days

    def backorder_window_expired(self, hold_days=None):
        """True once the order is too old to hold a part on backorder."""
        return self.backorder_days_remaining(hold_days) <= 0
```

The `PartsSettings` import is local to the method to avoid a circular import inside the `parts.models` package.

- [ ] **Step 5: Simplify the item status choices and drop `backorder_since`**

In `parts/models/parts_order_item.py`, replace lines 25-33 with:

```python
    # `backordered` = on hold awaiting stock; `status` = the line's own outcome.
    # There is no stored `completed` — a line counts as completed when its order
    # is completed and it was not refunded. That is derived in the serializer.
    STATUS_CHOICES = [
        ('to_order', 'To Order'),
        ('refunded', 'Refunded'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='to_order')
    backordered = models.BooleanField(default=False, help_text="Understocked at order time / placed on backorder by admin.")
```

Note the hold clock now lives on `PartsOrder`, so `backorder_since` is deleted outright.

- [ ] **Step 6: Create the migration**

Create `parts/migrations/0005_parts_item_status_simplification.py`:

```python
from django.db import migrations, models


def forwards(apps, schema_editor):
    """Legacy `ordered` and `fulfilled` both collapse into `to_order`.

    Per-line fulfilment is no longer tracked; completion is derived from the
    order status instead.
    """
    PartsOrderItem = apps.get_model('parts', 'PartsOrderItem')
    PartsOrderItem.objects.filter(status__in=['ordered', 'fulfilled']).update(status='to_order')


def backwards(apps, schema_editor):
    PartsOrderItem = apps.get_model('parts', 'PartsOrderItem')
    PartsOrderItem.objects.filter(status='to_order').update(status='ordered')


class Migration(migrations.Migration):

    dependencies = [
        ("parts", "0004_remove_partssettings_domestic_shipping_fee_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="partsorder",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_payment", "Pending Payment"),
                    ("paid", "Paid"),
                    ("dispatched", "Dispatched"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                    ("refunded", "Refunded"),
                    ("partially_refunded", "Partially Refunded"),
                ],
                default="pending_payment",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="partsorderitem",
            name="status",
            field=models.CharField(
                choices=[("to_order", "To Order"), ("refunded", "Refunded")],
                default="to_order",
                max_length=20,
            ),
        ),
        migrations.RemoveField(
            model_name="partsorderitem",
            name="backorder_since",
        ),
    ]
```

- [ ] **Step 7: Verify no further migration is outstanding**

Run: `python manage.py makemigrations parts --check --dry-run`

Expected: `No changes detected`. If it reports changes, the model edits and the hand-written migration disagree — fix the migration to match the models.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `python -m pytest parts/tests/model_tests/test_parts_models.py -v`

Expected: PASS (all tests in the file, including the pre-existing ones).

- [ ] **Step 9: Commit**

```bash
git add parts/models/parts_order.py parts/models/parts_order_item.py parts/migrations/0005_parts_item_status_simplification.py parts/tests/model_tests/test_parts_models.py
git commit -m "feat(parts): simplify item statuses and move backorder clock to the order

Item status drops to to_order/refunded; completion is derived from the
order. The backorder hold now counts from the order date, so
backorder_since is removed."
```

---

### Task 2: Serve the backorder window on the order, not the line

**Files:**
- Modify: `parts/serializers/admin_order_serializers.py:34-80` (strip the item-level backorder fields), and `AdminPartsOrderDetailSerializer` at line 83
- Modify: `parts/views/admin_order_views.py:262-266` (`_admin_order_context`)
- Test: `parts/tests/view_tests/test_admin_orders.py`

**Interfaces:**
- Consumes: `PartsOrder.backorder_days_remaining(hold_days)`, `PartsOrder.backorder_window_expired(hold_days)` (Task 1).
- Produces: the order detail payload gains `backorder_days_remaining: int`, `backorder_window_expired: bool`, `backorder_hold_days: int`. Each item loses `backorder_since`, `backorder_days_remaining`, `backorder_overdue`.

- [ ] **Step 1: Write the failing test**

Add to `parts/tests/view_tests/test_admin_orders.py`, inside `class TestAdminDetailAndUpdate`:

```python
    def test_detail_exposes_order_level_backorder_window(self, admin_client):
        order = _order()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['backorder_hold_days'] == 14
        assert data['backorder_days_remaining'] == 14
        assert data['backorder_window_expired'] is False
        # the window is a property of the order, not of each line
        assert 'backorder_days_remaining' not in data['items'][0]
        assert 'backorder_since' not in data['items'][0]
        assert 'backorder_overdue' not in data['items'][0]

    def test_detail_reports_an_expired_window_for_an_old_order(self, admin_client):
        from django.utils import timezone
        from datetime import timedelta
        from parts.models import PartsOrder

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['backorder_days_remaining'] == -6
        assert data['backorder_window_expired'] is True
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py -v -k "backorder_window"`

Expected: FAIL with `KeyError: 'backorder_hold_days'`.

- [ ] **Step 3: Strip the backorder fields off the item serializer**

In `parts/serializers/admin_order_serializers.py`, in `AdminPartsOrderItemSerializer`:

Delete these two declarations (lines 35-36):

```python
    backorder_days_remaining = serializers.SerializerMethodField()
    backorder_overdue = serializers.SerializerMethodField()
```

Replace the `fields` list (lines 42-48) with:

```python
        fields = [
            'id', 'part_number', 'description', 'colour_name', 'model_name', 'model_code',
            'section_code', 'ref_number', 'quantity', 'unit_price', 'line_total',
            'status', 'backordered',
            'supplier_line_total', 'gross_profit',
        ]
```

Delete the three methods `_days_remaining`, `get_backorder_days_remaining`, and `get_backorder_overdue` (lines 67-80).

`from datetime import date` at the top of the file is now unused — delete that import. **Keep** the `PartsSettings` import; Step 4 below still needs it.

- [ ] **Step 4: Add the window fields to the order serializer**

In `AdminPartsOrderDetailSerializer` (line 83), add these declarations alongside the existing `payment_status` field:

```python
    backorder_days_remaining = serializers.SerializerMethodField()
    backorder_window_expired = serializers.SerializerMethodField()
    backorder_hold_days = serializers.SerializerMethodField()
```

Add `'backorder_days_remaining', 'backorder_window_expired', 'backorder_hold_days',` to its `Meta.fields` list, next to `'has_backorder'`.

Add these three methods to the class:

```python
    def _hold_days(self):
        hold_days = self.context.get('backorder_hold_days')
        return PartsSettings.get().backorder_hold_days if hold_days is None else hold_days

    def get_backorder_hold_days(self, obj):
        return self._hold_days()

    def get_backorder_days_remaining(self, obj):
        return obj.backorder_days_remaining(self._hold_days())

    def get_backorder_window_expired(self, obj):
        return obj.backorder_window_expired(self._hold_days())
```

This uses `PartsSettings`, so keep that import at the top of the file.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py -v -k "backorder_window"`

Expected: PASS.

- [ ] **Step 6: Fix the pre-existing test that asserts the old item fields**

`test_place_and_remove_backorder` (line 161) still asserts `item['backorder_since'] is not None` and `item['backorder_days_remaining'] == 14`. Replace its body with:

```python
    def test_place_and_remove_backorder(self, admin_client):
        order = _order(available=5)
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        item = next(i for i in r.json()['items'] if i['id'] == item_id)
        assert item['backordered'] is True
        assert r.json()['has_backorder'] is True
        assert r.json()['backorder_days_remaining'] == 14

        r2 = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'remove_backorder'}, format='json')
        assert r2.json()['has_backorder'] is False
```

- [ ] **Step 7: Run the whole admin order suite**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py -v`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add parts/serializers/admin_order_serializers.py parts/tests/view_tests/test_admin_orders.py
git commit -m "refactor(parts): serve the backorder window on the order

The hold clock now depends only on the order date, so it is one value per
order rather than a duplicate on every line."
```

---

### Task 3: Derive `completed` on each line from the order

**Files:**
- Modify: `parts/serializers/admin_order_serializers.py` (`AdminPartsOrderItemSerializer`)
- Modify: `parts/views/admin_order_views.py:262-266` (`_admin_order_context`)
- Test: `parts/tests/view_tests/test_admin_orders.py`

**Interfaces:**
- Consumes: `PartsOrder.STATUS_CHOICES` containing `completed` (Task 1); the item serializer shape from Task 2.
- Produces: item `status` on the wire is `to_order` | `completed` | `refunded`. `_admin_order_context(order)` returns a dict that now includes `'order_status'`.

- [ ] **Step 1: Write the failing test**

Add to `parts/tests/view_tests/test_admin_orders.py`:

```python
class TestDerivedItemCompletion:
    def test_lines_read_to_order_while_the_order_is_open(self, admin_client):
        order = _order()
        order.status = 'paid'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['items'][0]['status'] == 'to_order'

    def test_completing_the_order_completes_every_unrefunded_line(self, admin_client):
        order = _order()
        order.items.create(part_number='B-2', description='x', quantity=1,
                           unit_price=Decimal('60'), line_total=Decimal('60'))
        order.status = 'completed'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert [i['status'] for i in data['items']] == ['completed', 'completed']

    def test_a_refunded_line_stays_refunded_on_a_completed_order(self, admin_client):
        order = _order()
        item = order.items.first()
        item.status = 'refunded'
        item.save()
        order.status = 'completed'
        order.save()
        data = admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/').json()
        assert data['items'][0]['status'] == 'refunded'

    def test_completion_is_not_stored_on_the_row(self, admin_client):
        """The DB keeps to_order; only the wire value changes."""
        from parts.models import PartsOrderItem
        order = _order()
        order.status = 'completed'
        order.save()
        admin_client.get(f'/api/parts/admin/orders/{order.order_reference}/')
        assert PartsOrderItem.objects.get(pk=order.items.first().pk).status == 'to_order'
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py::TestDerivedItemCompletion -v`

Expected: FAIL — `assert 'to_order' == 'completed'` in the completing test.

- [ ] **Step 3: Override `status` on the item serializer**

In `AdminPartsOrderItemSerializer`, add the declaration alongside the other method fields:

```python
    status = serializers.SerializerMethodField()
```

And add the method:

```python
    def get_status(self, obj):
        """`completed` is derived, never stored.

        Completing an order completes every line that was not refunded, so
        there is only ever one stored write path (items -> order, via
        PartsOrder.recompute_rollup) and nothing to keep in sync.
        """
        order_status = self.context.get('order_status')
        if order_status is None:
            order_status = obj.parts_order.status
        if obj.status != 'refunded' and order_status == 'completed':
            return 'completed'
        return obj.status
```

The context lookup avoids an N+1 query — `obj.parts_order` would hit the DB once per line since items arrive via `prefetch_related('items')`.

- [ ] **Step 4: Put the order status into the serializer context**

In `parts/views/admin_order_views.py`, replace `_admin_order_context` (lines 262-266) with:

```python
def _admin_order_context(order):
    return {
        'backorder_hold_days': PartsSettings.get().backorder_hold_days,
        'supplier_prices': supplier_price_map(order),
        'order_status': order.status,
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py -v`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add parts/serializers/admin_order_serializers.py parts/views/admin_order_views.py parts/tests/view_tests/test_admin_orders.py
git commit -m "feat(parts): derive line completion from the order status

Completing an order now completes every unrefunded line, with no stored
per-line fulfilment flag to drift."
```

---

### Task 4: Rework the item actions and hard-block expired backorders

**Files:**
- Modify: `parts/views/admin_order_views.py:22` (`ITEM_ACTIONS`) and `:235-250` (the action branches)
- Test: `parts/tests/view_tests/test_admin_orders.py`

**Interfaces:**
- Consumes: `PartsOrder.backorder_window_expired()` (Task 1).
- Produces: `ITEM_ACTIONS == {'place_backorder', 'remove_backorder', 'mark_refunded', 'mark_to_order'}`. `place_backorder` returns HTTP 400 when the order's hold window has closed.

- [ ] **Step 1: Write the failing tests**

Add to `parts/tests/view_tests/test_admin_orders.py`, inside `class TestAdminItemActions`:

```python
    def test_mark_fulfilled_is_no_longer_an_action(self, admin_client):
        order = _order()
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_fulfilled'}, format='json')
        assert r.status_code == 400

    def test_mark_to_order_undoes_a_refund(self, admin_client):
        order = _order()
        item_id = order.items.first().id
        admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_refunded'}, format='json')
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'mark_to_order'}, format='json')
        item = next(i for i in r.json()['items'] if i['id'] == item_id)
        assert item['status'] == 'to_order'

    def test_place_backorder_blocked_once_the_window_has_closed(self, admin_client):
        from django.utils import timezone
        from datetime import timedelta
        from parts.models import PartsOrder, PartsOrderItem

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        assert r.status_code == 400
        assert 'backorder window' in r.json()['detail'].lower()
        assert PartsOrderItem.objects.get(pk=item_id).backordered is False

    def test_place_backorder_blocked_exactly_on_the_boundary(self, admin_client):
        from django.utils import timezone
        from datetime import timedelta
        from parts.models import PartsOrder

        order = _order()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=14)
        )
        item_id = order.items.first().id
        r = admin_client.patch(f'/api/parts/admin/items/{item_id}/', {'action': 'place_backorder'}, format='json')
        assert r.status_code == 400

    def test_remove_backorder_still_allowed_after_the_window_closes(self, admin_client):
        """An operator must always be able to clear a stale flag."""
        from django.utils import timezone
        from datetime import timedelta
        from parts.models import PartsOrder

        order = _order()
        item = order.items.first()
        item.backordered = True
        item.save()
        PartsOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        r = admin_client.patch(f'/api/parts/admin/items/{item.id}/', {'action': 'remove_backorder'}, format='json')
        assert r.status_code == 200
        assert r.json()['has_backorder'] is False
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py::TestAdminItemActions -v`

Expected: FAIL — `mark_fulfilled` returns 200, `mark_to_order` returns 400, and the expired-window calls return 200.

- [ ] **Step 3: Update the action set**

In `parts/views/admin_order_views.py`, replace line 22 with:

```python
ITEM_ACTIONS = {'place_backorder', 'remove_backorder', 'mark_refunded', 'mark_to_order'}
```

- [ ] **Step 4: Rewrite the action branches**

Replace lines 235-250 (the `if action == 'place_backorder':` block through `item.status = 'ordered'`) with:

```python
        if action == 'place_backorder':
            if item.parts_order.backorder_window_expired():
                return Response(
                    {'detail': 'The backorder window has already closed for this order. '
                               'Refund this line instead.'},
                    status=400,
                )
            item.backordered = True
            item.status = 'to_order'
        elif action == 'remove_backorder':
            item.backordered = False
        elif action == 'mark_refunded':
            item.status = 'refunded'
            item.backordered = False
        elif action == 'mark_to_order':
            item.status = 'to_order'
```

`item.parts_order` is already loaded — line 227 uses `select_related('parts_order')`. The `backorder_since` assignments are gone with the field.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m pytest parts/tests/view_tests/test_admin_orders.py -v`

Expected: PASS.

- [ ] **Step 6: Run the full parts suite for regressions**

Run: `python -m pytest parts/ -v`

Expected: PASS. `parts/tests/view_tests/test_checkout.py` touches `backordered` at order time — it must still pass, since `checkout.py` never set `backorder_since`.

- [ ] **Step 7: Commit**

```bash
git add parts/views/admin_order_views.py parts/tests/view_tests/test_admin_orders.py
git commit -m "feat(parts): drop mark_fulfilled and block expired backorders

Per-line actions reduce to backorder and refund. Placing a line on
backorder is refused once the order is past the hold window."
```

---

### Task 5: Frontend types and service

**Files:**
- Modify: `frontend/types/partsAdmin.ts:25-29` (item fields), `:42-69` (order fields), `:78-83` (`ItemAction`)
- Test: none (no frontend test suite — verified by `tsc`)

**Interfaces:**
- Consumes: the API shape from Tasks 2-4.
- Produces: `AdminPartsOrderItem.status: 'to_order' | 'completed' | 'refunded'`; `AdminPartsOrder.backorder_days_remaining: number`, `.backorder_window_expired: boolean`, `.backorder_hold_days: number`; `ItemAction = 'place_backorder' | 'remove_backorder' | 'mark_refunded' | 'mark_to_order'`.

- [ ] **Step 1: Update the item interface**

In `frontend/types/partsAdmin.ts`, replace lines 25-29 with:

```ts
  status: 'to_order' | 'completed' | 'refunded';
  backordered: boolean;
```

- [ ] **Step 2: Add the order-level backorder window**

In the `AdminPartsOrder` interface, immediately after `has_backorder: boolean;` (line 46), add:

```ts
  /** Days left in the hold, counted from the order date. Zero or negative means closed. */
  backorder_days_remaining: number;
  backorder_window_expired: boolean;
  backorder_hold_days: number;
```

- [ ] **Step 3: Update the action union**

Replace lines 78-83 with:

```ts
export type ItemAction =
  | 'place_backorder'
  | 'remove_backorder'
  | 'mark_refunded'
  | 'mark_to_order';
```

- [ ] **Step 4: Typecheck to surface every call site that must change**

Run: `cd frontend && npx tsc --noEmit`

Expected: FAIL, with errors in `app/dashboard/parts-orders/[reference]/PartsOrderDetailPage.tsx` for `mark_fulfilled`, `item.backorder_days_remaining`, and `item.backorder_overdue`. These are fixed in Task 6 — do not commit a broken typecheck; go straight on.

- [ ] **Step 5: Do not commit yet**

This task's output is only meaningful together with Task 6. Leave the changes staged and continue.

---

### Task 6: Order detail page — two toggles per line

**Files:**
- Modify: `frontend/app/dashboard/parts-orders/[reference]/PartsOrderDetailPage.tsx:210-212` (row render), `:324-385` (`ItemRow`)
- Test: none (verified by `tsc` + `lint` + manual check)

**Interfaces:**
- Consumes: `AdminPartsOrder.backorder_days_remaining`, `.backorder_window_expired`, `.backorder_hold_days`, and the new `ItemAction` union (Task 5).
- Produces: no exports beyond the existing default component.

- [ ] **Step 1: Add an item status badge map**

In `PartsOrderDetailPage.tsx`, below `const ORDER_STATUSES = [...]` (line 21), add:

```tsx
const ITEM_STATUS_BADGE: Record<string, string> = {
  to_order: 'border-gray-400 text-[var(--text-dark-primary)]',
  completed: 'border-green-600 text-green-700',
  refunded: 'border-orange-500 text-orange-600',
};
```

- [ ] **Step 2: Pass the order-level window down to each row**

Replace the row render (lines 210-212) with:

```tsx
              {order.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  busy={busy}
                  daysRemaining={order.backorder_days_remaining}
                  windowExpired={order.backorder_window_expired}
                  holdDays={order.backorder_hold_days}
                  onAction={itemAction}
                />
              ))}
```

- [ ] **Step 3: Rewrite `ItemRow`**

Replace the whole `ItemRow` function (lines 324-385) with:

```tsx
function ItemRow({ item, busy, daysRemaining, windowExpired, holdDays, onAction }: {
  item: AdminPartsOrderItem;
  busy: boolean;
  /** Days left in the hold for the whole order; zero or negative means closed. */
  daysRemaining: number;
  windowExpired: boolean;
  holdDays: number;
  onAction: (itemId: number, action: ItemAction) => void;
}) {
  const btn = 'rounded border border-gray-300 px-2 py-1 text-xs hover:border-black disabled:opacity-40';
  const settled = item.status === 'refunded' || item.status === 'completed';
  const daysOld = holdDays - daysRemaining;
  return (
    <TableRow className="border-border-light align-top">
      <TableCell>
        <div className="font-mono text-sm">{item.part_number}</div>
        <div className="text-xs text-[var(--text-dark-secondary)]">
          {item.description}{item.colour_name ? ` · ${item.colour_name}` : ''}
        </div>
        <div className="text-xs text-[var(--text-dark-secondary)]">{item.model_name} · {item.section_code} #{item.ref_number}</div>
      </TableCell>
      <TableCell className="text-sm">{item.quantity}</TableCell>
      <TableCell className="text-sm whitespace-nowrap">${item.line_total}</TableCell>
      <TableCell className="text-sm whitespace-nowrap text-[var(--text-dark-secondary)]">
        {item.supplier_line_total == null ? '—' : `$${item.supplier_line_total.toFixed(2)}`}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap font-medium text-emerald-700">
        {item.gross_profit == null ? '—' : `$${item.gross_profit.toFixed(2)}`}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={ITEM_STATUS_BADGE[item.status] ?? 'border-gray-400'}>
            {item.status.replace(/_/g, ' ')}
          </Badge>
          {item.backordered && (
            <span className={`text-xs font-medium ${daysRemaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
              Backorder · {daysRemaining < 0 ? `${-daysRemaining}d overdue` : `${daysRemaining}d left`}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {!settled && (
            <>
              {item.backordered ? (
                <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'remove_backorder')}>Remove backorder</button>
              ) : (
                <button
                  className={btn}
                  disabled={busy || windowExpired}
                  onClick={() => onAction(item.id, 'place_backorder')}
                >
                  Place on backorder
                </button>
              )}
              <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_refunded')}>Refund</button>
            </>
          )}
          {item.status === 'refunded' && (
            <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_to_order')}>Undo</button>
          )}
        </div>
        {!settled && !item.backordered && windowExpired && (
          <p className="mt-1 max-w-[14rem] text-xs italic text-[var(--text-dark-secondary)]">
            Order is {daysOld}d old; exceeds the {holdDays}-day backorder window. Refund instead.
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
```

Note there is no `Undo` for `completed` — that state is derived, so it is undone by changing the order status in the header dropdown, not from the row.

- [ ] **Step 4: Typecheck and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`

Expected: both clean. If `tsc` still reports `mark_fulfilled`, a call site was missed.

- [ ] **Step 5: Commit Tasks 5 and 6 together**

```bash
git add frontend/types/partsAdmin.ts "frontend/app/dashboard/parts-orders/[reference]/PartsOrderDetailPage.tsx"
git commit -m "feat(frontend): two toggles per parts line

Lines show to order / completed / refunded, with completion driven by the
order status. Backorder countdown reads from the order and the toggle is
disabled once the window has closed."
```

---

### Task 7: List page badge and operator guidance copy

**Files:**
- Modify: `frontend/app/dashboard/parts-orders/PartsOrdersListPage.tsx:23-30` (`PARTS_STATUS_BADGE`), `:297` (legend copy)
- Test: none (verified by `tsc` + `lint` + manual check)

**Interfaces:**
- Consumes: `completed` as a valid order status (Task 1).
- Produces: `PARTS_STATUS_BADGE` gains a `completed` entry. It is imported by `PartsOrderDetailPage.tsx:19`, so the detail header badge picks it up automatically.

- [ ] **Step 1: Add the missing `completed` badge style**

`STATUS_STYLE` already styles `completed` (line 45) but `PARTS_STATUS_BADGE` does not, so a completed order currently renders with the fallback border. Replace lines 23-30 with:

```tsx
export const PARTS_STATUS_BADGE: Record<string, string> = {
  pending_payment: 'border-amber-500 text-[var(--highlight)]',
  paid: 'border-green-600 text-green-700',
  dispatched: 'border-blue-500 text-blue-700',
  completed: 'border-emerald-600 text-emerald-700',
  cancelled: 'border-red-500 text-destructive',
  refunded: 'border-orange-500 text-orange-600',
  partially_refunded: 'border-orange-400 text-orange-500',
};
```

The emerald matches the `completed` swatch already used in `STATUS_STYLE`.

- [ ] **Step 2: Update the operator guidance copy**

The instruction at line 297 predates this change: it implies per-line fulfilment and does not say when the backorder clock starts. Replace that `<li>` with:

```tsx
          <li>Mark affected items as backordered or refunded. The {backorderDays}-day backorder window runs from the <strong>order date</strong>, not from when you flag the line — once it has passed you can no longer place a line on backorder and should refund it instead. Only use <strong>Email refund update</strong> after the relevant Stripe refund has been processed.</li>
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`

Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/dashboard/parts-orders/PartsOrdersListPage.tsx
git commit -m "feat(frontend): style completed orders and correct backorder copy"
```

---

### Task 8: End-to-end verification

**Files:** none modified — this task only runs and observes.

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: nothing.

- [ ] **Step 1: Run the full backend suite**

Run: `python -m pytest parts/ notifications/ -v`

Expected: PASS. If `notifications/` has no tests, run `python -m pytest parts/ -v` alone.

- [ ] **Step 2: Confirm no stale references to the removed concepts remain**

Run: `git grep -n "mark_fulfilled\|backorder_since\|'fulfilled'\|\"fulfilled\"" -- ':!frontend/node_modules' ':!venv' ':!parts/migrations'`

Expected: no output. Migrations are excluded because `0003` legitimately records the historical choice list, and the `0005` `backwards` function legitimately references `ordered`.

Note: `_docs/notifications.md` and `notifications/templates/notifications/emails/admin_reminder.html` use the word "unfulfilled" as prose about the admin reminder email, which is unrelated to line status. Leave those alone.

- [ ] **Step 3: Apply the migration to the dev database**

Run: `python manage.py migrate parts`

Expected: `Applying parts.0005_parts_item_status_simplification... OK`

- [ ] **Step 4: Manual check in the running app**

Start the backend and frontend, then open a paid parts order at `/dashboard/parts-orders/<reference>`. Confirm:

1. Each line shows a grey **to order** badge with only **Place on backorder** and **Refund** buttons — no Fulfilled button.
2. Placing a line on backorder shows `Backorder · Nd left`, where N counts down from the order date.
3. Setting the header status dropdown to **completed** and pressing **Save** succeeds (no 400) and flips every unrefunded line to a green **completed** badge with no action buttons.
4. Refunding a line, then completing the order, leaves that line orange **refunded** with an **Undo** button.
5. On an order older than the hold window, **Place on backorder** is disabled with the explanatory note beneath it.

For point 5, age an order from the Django shell:

```bash
python manage.py shell -c "
from datetime import timedelta
from django.utils import timezone
from parts.models import PartsOrder
o = PartsOrder.objects.filter(status='paid').first()
PartsOrder.objects.filter(pk=o.pk).update(created_at=timezone.now() - timedelta(days=20))
print(o.order_reference)
"
```

- [ ] **Step 5: Commit any fixes found during manual checking**

If steps 1-5 all pass with no code change needed, there is nothing to commit and this task is done.
