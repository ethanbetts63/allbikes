"""Server-side parts checkout: revalidate cart lines and build a PartsOrder.

Prices are always recomputed from the live catalog (never trusted from the
client). Understocked parts are allowed as backorders and flagged; only parts
absent from the PA feed block checkout.
"""
from decimal import Decimal

from django.db import transaction

from parts.models import Part, PartsOrder, PartsOrderItem, PartsSettings, SectionPart
from parts.pricing import customer_unit_price, supplier_discount_percentage, supplier_unit_cost

class CheckoutError(Exception):
    def __init__(self, message, unavailable=None):
        super().__init__(message)
        self.message = message
        self.unavailable = unavailable or []


@transaction.atomic
def create_parts_order(*, customer, items):
    """Create a pending PartsOrder from validated customer data + cart items.

    `customer` is a dict of customer/address fields; `items` is a list of
    ``{part_number, quantity}``. Raises CheckoutError (with `unavailable` part
    numbers) if any line is not orderable.
    """
    if not items:
        raise CheckoutError("Your cart is empty.")

    settings = PartsSettings.get()
    if not settings.enable_new_part_sales:
        raise CheckoutError("New SYM parts sales are temporarily unavailable.")
    order_items = []
    subtotal = Decimal('0')
    has_backorder = False
    unavailable = []
    discount_percentage = supplier_discount_percentage()

    for line in items:
        part_number = (line.get('part_number') or '').strip()
        try:
            qty = int(line.get('quantity') or 1)
        except (TypeError, ValueError):
            qty = 1
        qty = max(qty, 1)
        if qty > 100:
            raise CheckoutError("A maximum of 100 of any one part can be ordered at once.")

        part = Part.objects.filter(part_number=part_number).first()
        fitment_key = (line.get('fitment_key') or '').strip()
        section_part_id = line.get('section_part_id')
        fitment_filter = {'fitment_key': fitment_key} if fitment_key else {'pk': section_part_id}
        section_part = (
            SectionPart.objects.select_related('section', 'section__parts_model')
            .filter(part=part, **fitment_filter).first()
            if part and (fitment_key or section_part_id) else None
        )
        if not part or not part.is_orderable or not section_part:
            unavailable.append(part_number)
            continue

        rrp_price = part.wholesale_price_incl_gst
        unit_price = customer_unit_price(rrp_price, settings.markup_percentage)
        actual_unit_cost = supplier_unit_cost(rrp_price, discount_percentage)
        line_total = unit_price * qty
        subtotal += line_total
        backordered = part.available_qty is None or part.available_qty < qty
        has_backorder = has_backorder or backordered

        order_items.append(PartsOrderItem(
            part_number=part.part_number,
            description=part.description,
            colour_name=part.colour_name,
            quantity=qty,
            rrp_unit_price_incl_gst=rrp_price,
            supplier_discount_percentage=discount_percentage,
            supplier_unit_cost_incl_gst=actual_unit_cost,
            markup_percentage=settings.markup_percentage,
            unit_price=unit_price,
            line_total=line_total,
            backordered=backordered,
            model_name=section_part.section.parts_model.name,
            model_code=section_part.section.parts_model.model_code,
            section_code=section_part.section.code,
            ref_number=section_part.ref_number,
        ))

    if unavailable:
        raise CheckoutError("Some items are no longer available.", unavailable)

    shipping = settings.shipping_fee
    total = subtotal + shipping

    order = PartsOrder.objects.create(
        customer_name=customer['customer_name'],
        customer_email=customer['customer_email'],
        customer_phone=customer.get('customer_phone', ''),
        address_line1=customer['address_line1'],
        address_line2=customer.get('address_line2', ''),
        suburb=customer['suburb'],
        state=customer.get('state', ''),
        postcode=customer['postcode'],
        country='Australia',
        terms_accepted=bool(customer.get('terms_accepted')),
        has_backorder=has_backorder,
        backorder_hold_days=settings.backorder_hold_days,
        subtotal=subtotal,
        shipping=shipping,
        total=total,
    )
    for item in order_items:
        item.parts_order = order
    PartsOrderItem.objects.bulk_create(order_items)
    return order
