"""
SMS message copy for admin notifications.
Each function returns a plain string for sending via Twilio.
"""


def admin_new_order(order):
    if order.payment_type == 'deposit':
        return (
            f"New ScooterShop deposit: {order.order_reference} — "
            f"{order.motorcycle} — ${order.amount_paid} deposit. "
            f"Customer: {order.customer_name} {order.customer_phone or ''}".strip()
        )
    return (
        f"New ScooterShop order: {order.order_reference} — "
        f"{order.product.name} — ${order.amount_paid}. "
        f"Customer: {order.customer_name} {order.customer_phone or ''}".strip()
    )


def admin_new_hire(booking):
    return (
        f"New hire booking: {booking.booking_reference} — "
        f"{booking.motorcycle}, "
        f"{booking.hire_start.strftime('%d %b')} to {booking.hire_end.strftime('%d %b')}. "
        f"Customer: {booking.customer_name} {booking.customer_phone or ''}".strip()
    )


def admin_new_service(booking_data):
    customer_name = booking_data.get('name') or (
        f"{booking_data.get('first_name', '')} {booking_data.get('last_name', '')}".strip()
    )
    make = booking_data.get('make', '')
    model = booking_data.get('model', '')
    services = ', '.join(booking_data.get('job_type_names', []))
    return (
        f"New service booking: {make} {model} — {services}. "
        f"Drop-off: {booking_data.get('drop_off_time', '')}. "
        f"Customer: {customer_name} {booking_data.get('phone', '')}".strip()
    )
