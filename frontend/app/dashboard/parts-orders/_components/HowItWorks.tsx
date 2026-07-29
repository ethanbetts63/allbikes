/** Operator guidance for the whole SYM parts workflow. */
export default function HowItWorks({ backorderDays }: { backorderDays: number }) {
  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-950">How it works</h2>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-slate-600">
        <li>Each day, the system imports the latest SYM price and availability data from Select Portal.</li>
        <li>Customers choose their model, section and exploded diagram, then add the required parts to their cart.</li>
        <li>At checkout, the customer price is Select Portal&apos;s base price plus our markup and the shipping fee.</li>
        <li>Admin receives an email and SMS for each paid order. Open it here, review it, choose <strong>Email supplier</strong>, check the draft and send it to Select Scooters.</li>
        <li>Select Scooters should fulfil only complete orders. If anything is unavailable, they should email us with the missing parts and expected restock date.</li>
        <li>If one or more items go on backorder, mark those items and use <strong>Email backorder update</strong> to send the customer a full line-by-line update.</li>
        <li>The {backorderDays}-day backorder window runs from the <strong>order date</strong>, once it has passed you can no longer place a line on backorder and should refund it instead. Only use <strong>Email refund update</strong> after the relevant Stripe refund has been processed.</li>
        <li>When you have arranged the order with the supplier, use <strong>Email order arranged</strong> to tell the customer their complete order has been arranged for shipment.</li>
        <li><strong>Planned next:</strong> admin will receive email and SMS reminders when an order exceeds that window. Then remove unavailable items and process the appropriate partial or full Stripe refund.</li>
      </ol>
    </section>
  );
}
