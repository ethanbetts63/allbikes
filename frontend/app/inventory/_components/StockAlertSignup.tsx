'use client';

import { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { subscribeToStockAlerts } from '@/lib/api';

export default function StockAlertSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      await subscribeToStockAlerts(email.trim());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <aside className="rounded-lg border border-[var(--highlight)] bg-amber-50 p-4 sm:p-5">
      <div className="flex gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--highlight)]" />
        <div className="min-w-0">
          <h2 className="font-bold text-[var(--text-dark-primary)]">Get bike stock alerts</h2>
          <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
            Get an email when new, demo, or used motorcycles and scooters are added to our stock. We won&apos;t email you for any other reason.
          </p>
          {status === 'success' ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-800">
              <CheckCircle2 className="h-4 w-4" /> You&apos;re signed up for bike stock alerts.
            </p>
          ) : (
            <form onSubmit={subscribe} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-black"
              />
              <button type="submit" disabled={status === 'sending'} className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                {status === 'sending' ? 'Signing up…' : 'Sign up'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="mt-2 text-sm text-red-700">We couldn&apos;t sign you up just now. Please try again.</p>}
        </div>
      </div>
    </aside>
  );
}
