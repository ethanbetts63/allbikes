'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function PartsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    // Navigate on any input so Enter always lands on the results page; the page
    // itself prompts for more characters when the query is too short (< 2).
    if (q) {
      router.push(`/parts/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form onSubmit={submit} role="search">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search part number, description or model…"
        aria-label="Search parts"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-black focus:outline-none"
      />
    </form>
  );
}
