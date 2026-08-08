import { Button } from '@/components/ui/button';

const FIELD = 'mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm';

/**
 * Shared compose fields for staff-written outbound email.
 *
 * `toReadOnly` is the meaningful choice here. The parts supplier email starts
 * blank and editable because no supplier address is stored anywhere and a
 * person must supply it. A reply to a customer enquiry is the opposite: the
 * recipient is fixed to the address that wrote in, so it is shown but locked.
 */
export default function EmailComposer({
  to, subject, body, sending, toPlaceholder, toReadOnly = false, sendLabel = 'Send email',
  onToChange, onSubjectChange, onBodyChange, onSend,
}: {
  to: string;
  subject: string;
  body: string;
  sending: boolean;
  toPlaceholder?: string;
  toReadOnly?: boolean;
  sendLabel?: string;
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
          readOnly={toReadOnly}
          placeholder={toPlaceholder}
          className={toReadOnly ? `${FIELD} bg-muted text-[var(--text-dark-secondary)]` : FIELD}
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
        {sending ? 'Sending…' : sendLabel}
      </Button>
    </div>
  );
}
