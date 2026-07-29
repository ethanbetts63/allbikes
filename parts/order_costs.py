from decimal import Decimal

from parts.models import Part


def supplier_price_map(order):
    """Map each ordered part number to its current supplier catalogue row."""
    return Part.objects.in_bulk(
        [item.part_number for item in order.items.all()], field_name='part_number'
    )


def supplier_cost_rows(order, prices=None):
    """Calculate current supplier cost and gross profit once for every line."""
    prices = supplier_price_map(order) if prices is None else prices
    rows = []
    for item in order.items.all():
        part = prices.get(item.part_number)
        unit_cost = part.wholesale_price_incl_gst if part else None
        line_cost = unit_cost * item.quantity if unit_cost is not None else None
        rows.append({
            'item': item,
            'unit_cost': unit_cost,
            'line_cost': line_cost,
            'gross_profit': item.line_total - line_cost if line_cost is not None else None,
        })
    return rows


def supplier_line_cost(item, prices):
    part = prices.get(item.part_number)
    if part is None or part.wholesale_price_incl_gst is None:
        return None
    return part.wholesale_price_incl_gst * item.quantity


def order_margin(order, prices=None):
    rows = supplier_cost_rows(order, prices)
    supplier_total = sum(
        (row['line_cost'] for row in rows if row['line_cost'] is not None),
        start=Decimal('0.00'),
    )
    customer_total = sum((row['item'].line_total for row in rows), start=Decimal('0.00'))
    return {
        'supplier_parts_total': supplier_total,
        'customer_parts_total': customer_total,
        'gross_profit_total': customer_total - supplier_total,
        'has_unpriced_items': any(row['line_cost'] is None for row in rows),
    }
