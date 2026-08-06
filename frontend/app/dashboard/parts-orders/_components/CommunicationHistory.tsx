import MessageTable from '@/components/messages/MessageTable';
import type { AdminPartsOrder } from '@/app/dashboard/parts-orders/_lib/partsAdmin';

/** Outbound messages scoped to this parts order. Each row opens the message detail. */
export default function CommunicationHistory({ messages }: {
  messages: AdminPartsOrder['messages'];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-bold">Communication History</h2>
      <MessageTable messages={messages} emptyMessage="No emails recorded for this order yet." />
    </section>
  );
}
