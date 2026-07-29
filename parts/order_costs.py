from decimal import Decimal

from parts.pricing import gross_profit_ex_gst, profit_margin_percentage


def supplier_cost_rows(order):
    """Return each line's immutable checkout pricing snapshots."""
    return [
        {
            'item': item,
            'rrp_unit_price_incl_gst': item.rrp_unit_price_incl_gst,
            'rrp_line_total_incl_gst': item.rrp_line_total_incl_gst,
            'unit_cost_incl_gst': item.supplier_unit_cost_incl_gst,
            'line_cost_incl_gst': item.supplier_line_total_incl_gst,
            'gross_profit_ex_gst': item.gross_profit_ex_gst,
            'profit_margin_percentage': item.profit_margin_percentage,
        }
        for item in order.items.all()
    ]


def order_margin(order):
    rows = supplier_cost_rows(order)
    priced_rows = [row for row in rows if row['line_cost_incl_gst'] is not None]
    supplier_total = sum(
        (row['line_cost_incl_gst'] for row in priced_rows), start=Decimal('0.00')
    )
    customer_total = sum(
        (row['item'].line_total for row in priced_rows), start=Decimal('0.00')
    )
    gross_profit = gross_profit_ex_gst(customer_total, supplier_total)
    margin_percentage = profit_margin_percentage(customer_total, supplier_total)
    return {
        'supplier_parts_total_incl_gst': supplier_total,
        'customer_parts_total_incl_gst': customer_total,
        'gross_profit_ex_gst_total': gross_profit,
        'profit_margin_percentage': margin_percentage,
        'has_unpriced_items': len(priced_rows) != len(rows),
    }
