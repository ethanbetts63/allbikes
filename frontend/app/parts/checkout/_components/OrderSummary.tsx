interface SummaryLine {
  part_number: string;
  description: string;
  colour_name?: string | null;
  quantity: number;
  unit_price: string;
  backordered?: boolean;
}

interface Props {
  items: SummaryLine[];
  subtotal: number;
  shipping?: number | null;
  total?: number | null;
}

export default function OrderSummary({ items, subtotal, shipping, total }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Order summary</h2>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.part_number} className="flex items-start justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-black">{item.part_number}</span>
                {item.colour_name && (
                  <span className="rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-700">
                    {item.colour_name}
                  </span>
                )}
                {item.backordered && (
                  <span className="rounded border border-black px-1 py-0.5 text-xs font-medium text-black">
                    Backorder
                  </span>
                )}
              </div>
              <div className="text-gray-600">{item.description}</div>
              <div className="text-xs text-gray-500">Qty {item.quantity}</div>
            </div>
            <div className="whitespace-nowrap font-semibold text-black">
              ${(Number(item.unit_price) * item.quantity).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal (incl. GST)</span>
          <span className="text-black">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="text-black">
            {shipping == null ? 'Calculated at payment' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold text-black">
          <span>Total</span>
          <span>${(total ?? subtotal).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
