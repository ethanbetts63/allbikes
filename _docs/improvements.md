
### Bugs / Logical Issues

**1. No validation that `discount_price < price` (`product.py:16-22`)**
`discount_price` is a free `DecimalField` with no constraint. An admin could accidentally set it higher than `price`, making the "discounted" price actually more expensive. A `clean()` method or serializer validation should enforce `discount_price < price` when both are set.

**2. `stock_quantity` has no minimum value constraint (`product.py:23`)**
`IntegerField(default=0)` with no `MinValueValidator(0)`. An admin PATCH can set stock to a negative number with no error. Should add `validators=[MinValueValidator(0)]`.

**3. `manage_images` swallows all exceptions with no logging (`product_viewset.py:83`)**
The bare `except Exception` returns a generic 500 with no logging whatsoever (the inventory version had at least a comment about it). Any bug inside the atomic block disappears silently. Should log with `logger.exception(...)` at minimum.

### Simplification / Design Issues

**4. `in_stock` / `low_stock` only exist in the serializer (`product_serializer.py:32-36`)**
These are logical properties of a product but live only as `SerializerMethodField`s. If any other part of the codebase (e.g., payments) needs to check stock status, it has to re-implement `stock_quantity > 0`. These belong as `@property` methods on the `Product` model, with the serializer just referencing them.

**5. No atomic stock decrement on purchase**
Stock is adjusted by directly PATCHing `stock_quantity`. In a concurrent environment (two simultaneous orders), a direct set is a race condition — both reads could see `stock_quantity = 1`, both proceed, and stock goes to -1. A `F()` expression-based update or a dedicated decrement endpoint would be safer.

---

## `payments` app

### Bugs / Logical Issues

**1. Float arithmetic used for currency amounts (`create_payment_intent_view.py:42-45`)**
`float(discount)` and `float(product.price)` convert `Decimal` values to floats before multiplying by 100 to get cents. Floating-point imprecision with currency is a classic bug — e.g., `float(Decimal('14.99')) * 100` can produce `1498.9999999999998`. Should work entirely in `Decimal` or convert to cents using `int(price * 100)` where `price` is still a `Decimal`.

**2. `OrderRetrieveView` exposes full PII to anyone (`order_views.py:28-36`)**
The endpoint is `AllowAny` and only requires the `order_reference` in the URL. Anyone who knows or guesses the 8-character hex reference can retrieve the customer's full name, email, phone number, and delivery address. There's no rate limiting and no additional verification step. At minimum, require the customer to also supply their email to match against the order before returning the full payload.

**3. Order doesn't snapshot price at purchase time (`order.py`, `order_serializer.py:23`)**
`OrderSerializer.product_price` reads from `product.price` at serialization time, not the price that was actually charged. If a product's price changes after an order is placed, the order history shows the wrong price. The actual charged amount is in `Payment.amount`, but the serializer doesn't use it. `Payment.amount` should be the source of truth and exposed via the order serializer.

**4. `product_price` serialized as `CharField` (`order_serializer.py:23`)**
`serializers.CharField(source='product.price')` coerces a `DecimalField` to a string. It works, but it's semantically wrong — downstream consumers expecting a number will get a string. Should be `DecimalField(source='product.price', max_digits=10, decimal_places=2)`.

**5. Orphaned `Notification` model and migration (`payments/migrations/`, `payments/models/`)**
`0003_notification.py`, `notification.py`, and `notification_factory.py` were all deleted but their compiled `.pyc` files remain. If this migration was ever applied to a database, the `payments_notification` table exists in the DB but is no longer tracked by Django's migration state — `migrate --check` will fail and future migrations may have integrity issues. The `.pyc` files should be cleared and if the migration was applied, a squash or compensating migration is needed.

**6. `handle_payment_intent_failed` not wrapped in a transaction (`webhook_handlers.py:52-63`)**
`handle_payment_intent_succeeded` uses `transaction.atomic()` for safety; `handle_payment_intent_failed` does not. If the `payment.save()` were to fail mid-way (rare, but possible), the handler could leave state inconsistent. Low risk with a single save, but worth making consistent.

### Simplification / Design Issues

**7. Admin $1.00 override is undocumented and implicit (`create_payment_intent_view.py:38-39`)**
Staff users automatically get charged $1.00 instead of the real product price. This is presumably a testing convenience, but it's completely undocumented and would silently undercharge a staff member who makes a real purchase through the storefront. Should be gated on a `DEBUG` flag or an explicit test-mode request header.

**8. `send_admin_reminders` sends one email per unpaid order (`send_admin_reminders.py:11-14`)**
If 10 orders are in `paid` status, the admin receives 10 separate reminder emails. A single digest email listing all outstanding orders would be far less noisy.

**9. Stale "Phase 4" comment in `OrderCreateView` (`order_views.py:20`)**
`# First gate: stock check (stock decrement moves to webhook in Phase 4)` — Phase 4 is done; the webhook handler already atomically decrements stock. The comment is now misleading.

**10. `_generate_reference()` infinite loop potential (`order.py:43-47`)**
The `while True:` collision-retry loop is fine in practice (8 hex chars = ~4.3 billion combos for a small shop), but it's technically an unbounded loop. If the namespace ever fills up or DB connections stall inside the loop, it hangs forever. A max-retries guard would make it fail fast instead.

---

## `notifications` app

### Bugs / Logical Issues

**1. `send_admin_reminder` shows UTC date instead of Perth time (`email.py:127`)**
`order.created_at.strftime('%d %b %Y')` formats the datetime without converting to Perth time first. `send_admin_new_order` does this correctly with `.astimezone(PERTH_TZ)` (line 93), but the reminder function doesn't. For orders placed in the morning AWST (before 8am UTC), the reminder email will show the previous calendar day.

**2. `send_test_email` imports private functions (`send_test_email.py:8`)**
The management command directly imports `_send_mailgun` and `_record` — functions explicitly marked private. This bypasses the public API of the email module. A proper `send_test_email(to, template)` public function in `utils/email.py` would be the right boundary.

### Simplification / Design Issues

**3. Generic FK on `SentMessage` is over-engineered (`models.py:24-26`)**
`content_type` / `object_id` / `content_object` adds a `ContentType` join on every lookup — but in practice only ever links to `Order`. A plain nullable `ForeignKey` to `Order` would be simpler, faster to query, and easier to read.

**4. `channel = 'sms'` choice with zero implementation (`models.py:8-10`)**
`CHANNEL_CHOICES` includes `sms` but there's no SMS sending utility anywhere. It's a misleading schema entry — either implement it or remove it until it's needed.

**5. Notification URLs have no names and no `app_name` (`urls.py`)**
Neither URL path has a `name=` parameter and there's no `app_name`. `reverse()` can't be used for these endpoints — hardcoded strings would be required. Every other app in the project uses named URLs.

---
