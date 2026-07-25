/**
 * Live stock/backorder state for a parts line, derived from the wholesaler's
 * approximate stock snapshot (`available_qty`) and the quantity being ordered.
 *
 * Two signals in one place so the diagram row and the cart never drift:
 *  - `kind` / `badge`  — the tiered stock badge (property of the part)
 *  - the backorder flip — whenever quantity > available (ship-complete policy)
 *
 * Stock is a ~daily snapshot, not a reservation, so everything is framed as
 * approximate ("~N") and nothing is ever promised.
 */

export type StockKind = 'in_stock' | 'low' | 'backorder';

export interface StockState {
  kind: StockKind;
  /** Short label for the badge. */
  badge: string;
  /** Longer explanatory line, present only when the line is backordered. */
  note: string | null;
}

/** At or above this many in stock we just say "In stock" (no precise count). */
export const LOW_STOCK_THRESHOLD = 5;

export function stockState(
  available: number | null | undefined,
  quantity: number,
): StockState {
  const q = Math.max(quantity || 1, 1);

  // Unknown or zero stock → backorder regardless of quantity.
  if (available == null || available <= 0) {
    return { kind: 'backorder', badge: 'Backorder', note: 'Backorder — ships when restocked' };
  }

  // Ordering more than we hold → whole line backordered (ship-complete policy).
  if (q > available) {
    return {
      kind: 'backorder',
      badge: 'Backorder',
      note: `~${available} in stock, ordering ${q} — ships complete within 14 days or partial shipment and refund if no stock.`,
    };
  }

  if (available < LOW_STOCK_THRESHOLD) {
    return { kind: 'low', badge: `Only ~${available} left`, note: null };
  }

  return { kind: 'in_stock', badge: 'In stock', note: null };
}
