import type { StockState } from '@/app/parts/_lib/partsStock';
import type { PartsCartItem } from '@/types/parts';

/**
 * One cart line: identity and stock on the left, quantity and price on the
 * right. The quantity control is passed in so this stays presentational.
 */
export default function CartLineRow({ item, stock, control, onRemove }: {
  item: PartsCartItem;
  stock: StockState;
  control: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-black">{item.part_number}</span>
          {item.colour_name && (
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700">
              {item.colour_name}
            </span>
          )}
          {stock.kind === 'backorder' ? (
            <span className="rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              Backorder
            </span>
          ) : stock.kind === 'low' ? (
            <span className="rounded border border-amber-300 px-1.5 py-0.5 text-xs font-medium text-amber-700">
              {stock.badge}
            </span>
          ) : (
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600">
              {stock.badge}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">{item.description}</div>
        <div className="text-xs text-gray-500">
          {item.model_name} · {item.section_code} · #{item.ref_number}
        </div>
        {stock.kind === 'backorder' && stock.note && (
          <div className="mt-1 text-xs font-medium text-amber-700">{stock.note}</div>
        )}
      </div>

      {control}

      <div className="w-20 text-right text-sm font-semibold text-black">
        ${(Number(item.unit_price) * item.quantity).toFixed(2)}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-sm text-gray-500 underline-offset-2 hover:text-black hover:underline"
        aria-label={`Remove ${item.part_number}`}
      >
        Remove
      </button>
    </li>
  );
}
