"""Deterministic parts pricing calculations using GST-inclusive source prices."""

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

CENT = Decimal('0.01')
HUNDRED = Decimal('100')
GST_FACTOR = Decimal('1.10')


def money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def supplier_discount_percentage():
    raw = settings.PARTS_SUPPLIER_DISCOUNT_PERCENTAGE
    try:
        percentage = Decimal(str(raw))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ImproperlyConfigured(
            'PARTS_SUPPLIER_DISCOUNT_PERCENTAGE must be a number from 0 to 100.'
        ) from exc
    if not Decimal('0') <= percentage <= HUNDRED:
        raise ImproperlyConfigured(
            'PARTS_SUPPLIER_DISCOUNT_PERCENTAGE must be from 0 to 100.'
        )
    return percentage


def supplier_unit_cost(rrp_price_incl_gst, discount_percentage):
    factor = Decimal('1') - (Decimal(discount_percentage) / HUNDRED)
    return money(Decimal(rrp_price_incl_gst) * factor)


def customer_unit_price(rrp_price_incl_gst, markup_percentage):
    factor = Decimal('1') + (Decimal(markup_percentage) / HUNDRED)
    return money(Decimal(rrp_price_incl_gst) * factor)


def gross_profit_ex_gst(customer_total_incl_gst, supplier_total_incl_gst):
    difference_incl_gst = Decimal(customer_total_incl_gst) - Decimal(supplier_total_incl_gst)
    return money(difference_incl_gst / GST_FACTOR)


def profit_margin_percentage(customer_total_incl_gst, supplier_total_incl_gst):
    customer_total = Decimal(customer_total_incl_gst)
    if customer_total == 0:
        return Decimal('0.00')
    percentage = (
        (customer_total - Decimal(supplier_total_incl_gst)) / customer_total
    ) * HUNDRED
    return percentage.quantize(CENT, rounding=ROUND_HALF_UP)
