'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function UnsubscribeStockAlertsPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'active' | 'done' | 'invalid'>('loading');

  useEffect(() => {
    fetch(`/api/inventory/stock-alerts/unsubscribe/${token}/`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setState(data.active ? 'active' : 'done'))
      .catch(() => setState('invalid'));
  }, [token]);

  const unsubscribe = async () => {
    const response = await fetch(`/api/inventory/stock-alerts/unsubscribe/${token}/`, { method: 'POST' });
    setState(response.ok ? 'done' : 'invalid');
  };

  return <div className="mx-auto max-w-lg px-4 py-20"><div className="rounded-lg border border-gray-200 bg-white p-6 text-center"><h1 className="text-2xl font-bold text-black">Scooter stock alerts</h1>{state === 'loading' && <p className="mt-3 text-gray-600">Checking your subscription…</p>}{state === 'active' && <><p className="mt-3 text-gray-600">Stop receiving emails about new scooter stock.</p><button onClick={unsubscribe} className="mt-5 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Unsubscribe</button></>}{state === 'done' && <p className="mt-3 text-gray-600">You have been unsubscribed from scooter stock alerts.</p>}{state === 'invalid' && <p className="mt-3 text-gray-600">This unsubscribe link is invalid or has expired.</p>}</div></div>;
}
