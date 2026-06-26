import Link from "next/link";
import logo320 from "../assets/logo-320w.webp";
import logo640 from "../assets/logo-640w.webp";
import logo768 from "../assets/logo-768w.webp";
import logo1024 from "../assets/logo-1024w.webp";
import logo1280 from "../assets/logo-1280w.webp";
import { cn } from "@/lib/utils";
import { siteSettings } from "@/config/siteSettings";
import { MapPin, Phone, Mail } from "lucide-react";
import MobileNavMenu from "@/components/MobileNavMenu";

const NAV_LINK = "text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200";

const NavBar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-white/10 relative">
      {siteSettings.enable_banner && siteSettings.banner_text && (
        <div className="bg-highlight text-[var(--text-dark-primary)] py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <p className="text-xs sm:text-sm font-semibold text-center leading-snug">
              {siteSettings.banner_text}
            </p>
          </div>
        </div>
      )}

      <div className="container flex h-20 items-stretch justify-between px-6">
        <Link href="/" className="shrink-0 flex items-stretch">
          <img
            src={logo1280.src}
            srcSet={`${logo320.src} 320w, ${logo640.src} 640w, ${logo768.src} 768w, ${logo1024.src} 1024w, ${logo1280.src} 1280w`}
            sizes="175px"
            width="1756"
            height="810"
            alt="ScooterShop Logo"
            className="h-full w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center justify-between self-center flex-1 pl-10">
          <Link href="/service" className={NAV_LINK}>Servicing</Link>
          {siteSettings.show_hire && <Link href="/hire" className={NAV_LINK}>Hire</Link>}
          <Link href="/inventory/scooters/new" className={NAV_LINK}>New Scooters</Link>
          <Link href="/inventory/scooters/used" className={NAV_LINK}>Used Scooters</Link>
          <Link href="/inventory/motorcycles/used" className={NAV_LINK}>Used Motorcycles</Link>
          {!siteSettings.hide_escooters && <Link href="/escooters" className={NAV_LINK}>E-Scooters</Link>}
          {siteSettings.show_workshop_clearance && <Link href="/inventory/motorcycles/parts" className={NAV_LINK}>Workshop Clearance</Link>}
          <Link href="/contact" className={cn(NAV_LINK, "border border-white/30 px-4 py-2 hover:border-amber-400")}>
            Contact
          </Link>
          <div className="hidden xl:flex flex-col gap-1.5">
            {(siteSettings.phone_number || siteSettings.mobile_number) && (
              <a
                href={`tel:${siteSettings.phone_number || siteSettings.mobile_number}`}
                className="flex items-center gap-1.5 text-[var(--text-light-secondary)] hover:text-[var(--highlight)] transition-colors text-xs"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {siteSettings.phone_number || siteSettings.mobile_number}
              </a>
            )}
            {siteSettings.email_address && (
              <a
                href={`mailto:${siteSettings.email_address}`}
                className="flex items-center gap-1.5 text-[var(--text-light-secondary)] hover:text-[var(--highlight)] transition-colors text-xs"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {siteSettings.email_address}
              </a>
            )}
          </div>
        </nav>

        <MobileNavMenu />
      </div>
    </header>
  );
};

export default NavBar;
