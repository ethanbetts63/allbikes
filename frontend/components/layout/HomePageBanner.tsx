'use client';

import { MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

const HOME_PAGE_PATHS = new Set([
  '/',
  '/50cc-scooters-perth',
  '/125cc-scooters-perth',
  '/vespa-perth',
  '/sym',
]);

export default function HomePageBanner({ text }: { text: string }) {
  const pathname = usePathname();

  if (!pathname || !HOME_PAGE_PATHS.has(pathname)) return null;

  return (
    <div className="bg-highlight px-4 py-2 text-[var(--text-dark-primary)]">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <p className="text-center text-xs font-semibold leading-snug sm:text-sm">{text}</p>
      </div>
    </div>
  );
}
