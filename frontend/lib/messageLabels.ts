export const MESSAGE_STATUS_BADGE: Record<string, string> = {
  sent:      'border-green-600 text-highlight1',
  failed:    'border-red-500 text-destructive',
  delivered: 'border-blue-500 text-blue-600',
  bounced:   'border-orange-500 text-orange-600',
};

const TYPE_LABELS: Record<string, string> = {
  customer_confirmation: 'Customer Confirmation',
  admin_new_order:       'Admin New Order',
  admin_reminder:        'Admin Reminder',
  hire_confirmation:     'Hire Confirmation',
  admin_new_hire:        'Admin New Hire',
  admin_service_booking: 'Admin Service Booking',
  stock_alert_update:    'Stock Alert Update',
};

/** Falls back to the raw type so new message types still render something. */
export const messageTypeLabel = (type: string) => TYPE_LABELS[type] ?? type;
