"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteSettings } from "@/config/siteSettings";

const NAV_LINK = "text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200";

const MobileNavMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="min-[968px]:hidden absolute right-[15px] bottom-0 h-20 flex items-center">
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 text-[var(--text-light-primary)] hover:text-[var(--highlight)] transition-colors duration-200"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className="absolute left-0 right-0 top-full min-[968px]:hidden bg-background border-t border-white/10">
          <nav className="flex flex-col px-6 py-4 gap-5">
            <Link href="/service" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Servicing</Link>
            {siteSettings.show_hire && <Link href="/hire" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Hire</Link>}
            <Link href="/inventory/scooters/new" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>New Scooters</Link>
            <Link href="/inventory/scooters/used" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Used Scooters</Link>
            <Link href="/inventory/motorcycles/used" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Used Motorcycles</Link>
            {!siteSettings.hide_escooters && <Link href="/escooters" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>E-Scooters</Link>}
            {siteSettings.show_workshop_clearance && <Link href="/inventory/motorcycles/parts" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Workshop Clearance</Link>}
            <Link href="/contact" className={NAV_LINK} onClick={() => setIsMenuOpen(false)}>Contact Us</Link>
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileNavMenu;
