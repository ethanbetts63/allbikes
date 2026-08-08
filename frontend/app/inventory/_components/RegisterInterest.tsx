'use client';

import { useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { registerBikeInterest } from '@/lib/api';

/**
 * The low-commitment alternative to paying a deposit.
 *
 * Email only, on purpose — this sits directly beneath the deposit button for
 * buyers who aren't ready to pay, so every extra field works against it.
 */
export default function RegisterInterest({ motorcycleId }: { motorcycleId: number }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      await registerBikeInterest(motorcycleId, email.trim());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <aside
      className={`rounded-lg border border-[var(--highlight)] bg-amber-50 p-4 sm:p-5 ${
        status === 'success' ? '' : 'animate-interest-glow'
      }`}
    >
      <div className="flex gap-3">
        <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[var(--highlight)]" />
        <div className="min-w-0">
          <h2 className="font-bold text-[var(--text-dark-primary)]">Register your interest in this bike</h2>
          <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
            Leave your email and we&apos;ll get in touch. No obligation.
          </p>
          {status === 'success' ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-800">
              <CheckCircle2 className="h-4 w-4" /> Thanks for your interest — we&apos;ll be in touch..
            </p>
          ) : (
            <form onSubmit={register} className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                {status === 'sending' ? 'Sending…' : 'Register interest'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="mt-2 text-sm text-red-700">We couldn&apos;t register your interest just now. Please try again.</p>}
        </div>
      </div>
    </aside>
  );
}
