"""Server-side parts checkout: revalidate cart lines and build a PartsOrder.

Prices are always recomputed from the live catalog (never trusted from the
client). Understocked parts are allowed as backorders and flagged; only parts
absent from the PA feed block checkout.
"""
from decimal import Decimal

from django.db import transaction

from parts.models import Part, PartsOrder, PartsOrderItem, PartsSettings, SectionPart

_AU_NAMES = {'australia', 'au', 'aus'}


class CheckoutError(Exception):
    def __init__(self, message, unavailable=None):
        super().__init__(message)
        self.message = message
        self.unavailable = unavailable or []


def is_international(country):
    return (country or 'Australia').strip().lower() not in _AU_NAMES


def _section_context(part):
    sp = (
        SectionPart.objects.filter(part=part)
        .select_related('section', 'section__parts_model')
        .first()
    )
    if not sp:
        return {}
    return {
        'model_name': sp.section.parts_model.name,
        'model_code': sp.section.parts_model.model_code,
        'section_code': sp.section.code,
        'ref_number': sp.ref_number,
    }


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
    order_items = []
    subtotal = Decimal('0')
    has_backorder = False
    unavailable = []

    for line in items:
        part_number = (line.get('part_number') or '').strip()
        try:
            qty = int(line.get('quantity') or 1)
        except (TypeError, ValueError):
            qty = 1
        qty = max(qty, 1)

        part = Part.objects.filter(part_number=part_number).first()
        if not part or not part.is_orderable:
            unavailable.append(part_number)
            continue

        unit_price = settings.apply_markup(part.wholesale_price_incl_gst)
        line_total = unit_price * qty
        subtotal += line_total
        backordered = part.available_qty is None or part.available_qty < qty
        has_backorder = has_backorder or backordered

        order_items.append(PartsOrderItem(
            part_number=part.part_number,
            description=part.description,
            colour_name=part.colour_name,
            quantity=qty,
            unit_price=unit_price,
            line_total=line_total,
            backordered=backordered,
            **_section_context(part),
        ))

    if unavailable:
        raise CheckoutError("Some items are no longer available.", unavailable)

    intl = is_international(customer.get('country'))
    shipping = settings.shipping_fee(intl)
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
        country=customer.get('country') or 'Australia',
        is_international=intl,
        terms_accepted=bool(customer.get('terms_accepted')),
        has_backorder=has_backorder,
        subtotal=subtotal,
        shipping=shipping,
        total=total,
    )
    for item in order_items:
        item.parts_order = order
    PartsOrderItem.objects.bulk_create(order_items)
    return order
