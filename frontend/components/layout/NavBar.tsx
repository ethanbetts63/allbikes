import Link from "next/link";
import NextImage from "next/image";
import logoImage from "../../assets/logo.webp";
import { cn } from "@/lib/utils";
import { siteSettings } from "@/lib/siteSettings";
import { Phone, Mail } from "lucide-react";
import MobileNavMenu from "@/components/layout/MobileNavMenu";
import DesktopScootersMenu from "@/components/layout/DesktopScootersMenu";
import HomePageBanner from "@/components/layout/HomePageBanner";

const NAV_LINK = "text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest hover:text-[var(--highlight)] transition-colors duration-200";

const NavBar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-white/10 relative">
      {siteSettings.enable_banner && siteSettings.banner_text && (
        <HomePageBanner text={siteSettings.banner_text} />
      )}

      <div className="container flex h-20 items-stretch px-6">
        <Link href="/" className="shrink-0 flex items-stretch">
          <NextImage
            src={logoImage}
            sizes="175px"
            alt="ScooterShop Logo"
            loading="eager"
            className="h-full w-auto object-contain"
          />
        </Link>

        <nav className="hidden min-[968px]:flex items-center gap-10 self-center ml-auto xl:flex-1 xl:ml-0 xl:pl-10 xl:justify-between xl:gap-0">
          <Link href="/service" className={NAV_LINK}>Servicing</Link>
          {siteSettings.show_hire && <Link href="/hire" className={NAV_LINK}>Hire</Link>}
          <DesktopScootersMenu />
          <Link href="/inventory/motorcycles/used" className={NAV_LINK}>Motorcycles</Link>
          <Link href="/parts/new/sym" className={NAV_LINK}>SYM Parts</Link>
          {siteSettings.show_workshop_clearance && <Link href="/inventory/motorcycles/parts" className={NAV_LINK}>Workshop Clearance</Link>}
          <Link href="/contact" className={cn(NAV_LINK, "border border-white/30 px-4 py-2 hover:border-amber-400")}>
            Contact
          </Link>
          <div className="hidden xl:flex flex-col justify-center gap-1.5">
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
      </div>

      <MobileNavMenu />
    </header>
  );
};

export default NavBar;
