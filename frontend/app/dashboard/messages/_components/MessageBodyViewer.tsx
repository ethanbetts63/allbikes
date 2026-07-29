import { useState } from 'react';

import type { SentMessage } from '@/types/SentMessage';

const TAB_ON = 'bg-black text-[var(--text-light-primary)] border-black';
const TAB_OFF = 'border-border-light text-[var(--text-dark-secondary)] hover:border-gray-400';

/**
 * The exact copy that was sent, HTML or plain text.
 *
 * The HTML is rendered in a sandboxed iframe: it is stored email markup, so it
 * must not run scripts or reach the parent page.
 */
export default function MessageBodyViewer({ message }: { message: SentMessage }) {
  const [tab, setTab] = useState<'html' | 'text'>('html');

  if (!message.body_html && !message.body_text) return null;

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-2">
        {message.body_html && (
          <button
            onClick={() => setTab('html')}
            className={`text-sm px-3 py-1 rounded border ${tab === 'html' ? TAB_ON : TAB_OFF}`}
          >
            HTML Preview
          </button>
        )}
        {message.body_text && (
          <button
            onClick={() => setTab('text')}
            className={`text-sm px-3 py-1 rounded border ${tab === 'text' ? TAB_ON : TAB_OFF}`}
          >
            Plain Text
          </button>
        )}
      </div>

      {tab === 'html' && message.body_html ? (
        <iframe
          srcDoc={message.body_html}
          className="w-full border border-border-light rounded"
          style={{ height: '600px' }}
          sandbox="allow-same-origin"
          title="Email HTML preview"
        />
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-[var(--text-dark-secondary)] bg-[var(--bg-light-secondary)] border border-border-light rounded p-4 font-mono">
          {message.body_text}
        </pre>
      )}
    </div>
  );
}
