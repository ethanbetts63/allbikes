import { Button } from '@/components/ui/button';

const FIELD = 'mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm';

/**
 * The compose fields for the supplier order email.
 *
 * `to` starts blank on purpose — no supplier address is stored or prefilled
 * anywhere, so a staff member has to enter it before anything can be sent.
 */
export default function SupplierEmailComposer({
  to, subject, body, sending, onToChange, onSubjectChange, onBodyChange, onSend,
}: {
  to: string;
  subject: string;
  body: string;
  sending: boolean;
  onToChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        To
        <input
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          type="email"
          autoComplete="off"
          placeholder="Enter supplier email address"
          className={FIELD}
        />
      </label>
      <label className="block text-sm font-medium">
        Subject
        <input value={subject} onChange={(e) => onSubjectChange(e.target.value)} className={FIELD} />
      </label>
      <label className="block text-sm font-medium">
        Email body
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={24}
          className="mt-1 w-full rounded-md border border-input bg-transparent p-3 font-mono text-sm leading-6"
        />
      </label>
      <Button onClick={onSend} disabled={sending || !to.trim() || !subject.trim() || !body.trim()}>
        {sending ? 'Sending…' : 'Send supplier email'}
      </Button>
    </div>
  );
}
