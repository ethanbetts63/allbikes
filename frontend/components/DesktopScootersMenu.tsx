'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { siteSettings } from '@/config/siteSettings';

const NAV_LINK = 'text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200';
const MENU_LINK = 'block px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-light-primary)] transition-colors hover:bg-white/10 hover:text-[var(--highlight)]';

export default function DesktopScootersMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative flex h-full items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${NAV_LINK} flex items-center gap-1 px-3 py-2 ${open
          ? 'bg-[var(--bg-dark-primary)] text-[var(--highlight)]'
          : 'bg-transparent hover:bg-[var(--bg-dark-primary)]'}`}
      >
        Scooters
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 min-w-52 overflow-hidden border border-white/15 bg-[var(--bg-dark-primary)] py-1 shadow-xl">
          <Link role="menuitem" href="/inventory/scooters/new" className={MENU_LINK} onClick={() => setOpen(false)}>New Scooters</Link>
          <Link role="menuitem" href="/inventory/scooters/used" className={MENU_LINK} onClick={() => setOpen(false)}>Used Scooters</Link>
          {!siteSettings.hide_escooters && <Link role="menuitem" href="/escooters" className={MENU_LINK} onClick={() => setOpen(false)}>E-Scooters</Link>}
        </div>
      )}
    </div>
  );
}
