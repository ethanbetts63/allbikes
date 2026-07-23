"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import defaultUsedImage from '@/assets/IMG_20250730_102056.webp';
import symWarrantyImage from '@/assets/sym_warranty_image.png';
import type {
  HomeHeroPanelConfig,
  HomeHeroProps,
  HomeHeroServiceConfig,
} from '@/types/HomeHeroProps';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';

interface SlotState {
  a: string;
  b: string;
  active: 'a' | 'b';
}

const defaultNewPanel: HomeHeroPanelConfig = {
  eyebrow: 'Browse Inventory',
  titleLines: ['New', 'Scooters'],
  href: '/inventory/scooters/new',
  linkText: 'Shop Now',
  alt: 'New scooters for sale at ScooterShop Perth',
  fallbackImage: symWarrantyImage.src,
  prependImage: symWarrantyImage.src,
  imageFit: 'contain',
};

const defaultUsedPanel: HomeHeroPanelConfig = {
  eyebrow: 'Browse Inventory',
  titleLines: ['Used', 'Motorcycles'],
  mobileTitleLines: ['Used', 'Bikes'],
  href: '/inventory/motorcycles/used',
  linkText: 'Shop Now',
  alt: 'Used motorcycles for sale at ScooterShop Perth',
  fallbackImage: defaultUsedImage.src,
  imageFit: 'cover',
};

const defaultServicePanel: HomeHeroServiceConfig = {
  eyebrow: 'ScooterShop · Perth',
  heading: 'Get Your Bike Serviced.',
  description: 'Servicing, tyres, puncture repairs, and general maintenance — petrol and electric.',
  href: '/service',
  linkText: 'Book Online',
};

function bikeImageUrls(
  bikes: HomeHeroProps['newBikes'],
  config: HomeHeroPanelConfig,
) {
  const bikeUrls = bikes
    .map((bike) => getPrimaryVehicleImage(bike.images, 'detail'))
    .filter((url): url is string => Boolean(url));
  const urls = config.prependImage
    ? [config.prependImage, ...bikeUrls.filter((url) => url !== config.prependImage)]
    : bikeUrls;

  return urls.length > 0 ? urls : [config.fallbackImage];
}

function CyclingImage({
  bikes,
  config,
  priority = false,
  sizes,
}: {
  bikes: HomeHeroProps['newBikes'];
  config: HomeHeroPanelConfig;
  priority?: boolean;
  sizes: string;
}) {
  const urls = useMemo(() => bikeImageUrls(bikes, config), [bikes, config]);
  const [desktop, setDesktop] = useState(false);
  const indexRef = useRef(0);
  const urlsRef = useRef(urls);
  const [slots, setSlots] = useState<SlotState>({ a: urls[0], b: urls[0], active: 'a' });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateDesktop = () => setDesktop(mediaQuery.matches);
    updateDesktop();
    mediaQuery.addEventListener('change', updateDesktop);
    return () => mediaQuery.removeEventListener('change', updateDesktop);
  }, []);

  useEffect(() => {
    if (!desktop || urls.length <= 1) return;
    const interval = window.setInterval(() => {
      const nextIndex = (indexRef.current + 1) % urlsRef.current.length;
      indexRef.current = nextIndex;
      const incoming = urlsRef.current[nextIndex];
      new Image().src = incoming;
      setSlots((current) => {
        const nextSlot = current.active === 'a' ? 'b' : 'a';
        return { ...current, [nextSlot]: incoming, active: nextSlot };
      });
    }, 8000);
    return () => window.clearInterval(interval);
  }, [desktop, urls.length]);

  const fitClass = config.imageFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <>
      <span className="absolute inset-0 md:hidden">
        <NextImage
          src={urls[0]}
          sizes="100vw"
          alt={config.alt}
          fill
          loading={priority ? 'eager' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          className={fitClass}
        />
      </span>
      <span className="absolute inset-0 hidden md:block">
        <NextImage
          src={slots.a}
          sizes={sizes}
          alt={config.alt}
          fill
          loading={priority ? 'eager' : undefined}
          fetchPriority={priority ? 'high' : undefined}
          className={`${fitClass} transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-100' : 'opacity-0'}`}
        />
        <NextImage
          src={slots.b}
          sizes={sizes}
          alt={config.alt}
          fill
          className={`${fitClass} transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
    </>
  );
}

function PanelTitle({ config, sizeClass }: { config: HomeHeroPanelConfig; sizeClass: string }) {
  const desktopLines = config.titleLines;
  const mobileLines = config.mobileTitleLines ?? desktopLines;

  return (
    <h2 className={`${sizeClass} text-[var(--text-light-primary)] font-black uppercase italic leading-none mb-4`}>
      <span className="md:hidden">
        {mobileLines.map((line, index) => (
          <span className="block" key={`${line}-${index}`}>{line}</span>
        ))}
      </span>
      <span className="hidden md:block">
        {desktopLines.map((line, index) => (
          <span className="block" key={`${line}-${index}`}>{line}</span>
        ))}
      </span>
    </h2>
  );
}

function InventoryPanel({
  bikes,
  config,
  priority,
  className,
  titleSize,
  sizes,
  variant = 'large',
}: {
  bikes: HomeHeroProps['newBikes'];
  config: HomeHeroPanelConfig;
  priority?: boolean;
  className: string;
  titleSize: string;
  sizes: string;
  variant?: 'large' | 'small';
}) {
  const isSmall = variant === 'small';
  const overlayClass = isSmall
    ? 'bg-[var(--bg-dark-primary)]/20'
    : 'bg-[var(--bg-dark-primary)]/30';
  const linkStyle = isSmall
    ? 'text-[var(--text-light-primary)]/70 text-xs border-white/30'
    : 'text-[var(--text-light-primary)] text-sm border-white/40';

  return (
    <Link href={config.href} className={`relative group overflow-hidden bg-[var(--bg-dark-primary)] ${className}`}>
      <CyclingImage bikes={bikes} config={config} priority={priority} sizes={sizes} />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 ${isSmall ? 'via-black/20' : 'via-black/10'} to-transparent`} />
      {!isSmall && <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />}
      <div className={`absolute inset-0 ${overlayClass} group-hover:bg-transparent transition-colors duration-300`} />
      <div className={`absolute bottom-0 left-0 ${isSmall ? 'p-7' : 'p-7 md:p-9'}`}>
        <p className={`text-[var(--highlight)] ${isSmall ? 'text-[9px] mb-2' : 'text-[10px] mb-3'} font-bold uppercase tracking-[0.25em]`}>
          {config.eyebrow}
        </p>
        <PanelTitle config={config} sizeClass={titleSize} />
        <span className={`inline-flex items-center ${linkStyle} font-bold uppercase tracking-widest border-b pb-0.5 group-hover:text-[var(--highlight)] group-hover:border-amber-400 transition-colors duration-200`}>
          {config.linkText}
          <ArrowRight className={`${isSmall ? 'ml-1.5 h-3.5 w-3.5' : 'ml-2 h-4 w-4'} group-hover:translate-x-1 transition-transform duration-200`} />
        </span>
      </div>
    </Link>
  );
}

function TextPanel({
  eyebrow,
  headingLines,
  description,
  phoneNumber,
  mobileNumber,
  emailAddress,
}: Pick<HomeHeroProps, 'phoneNumber' | 'mobileNumber' | 'emailAddress'> & {
  eyebrow: string;
  headingLines: string[];
  description: string;
}) {
  return (
    <div className="bg-[var(--bg-dark-primary)] flex flex-col justify-center items-center lg:items-start px-8 py-4 md:px-10 md:py-5 flex-1 text-center lg:text-left">
      <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-2">{eyebrow}</p>
      <h1 className="text-[var(--text-light-primary)] text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black uppercase italic leading-[0.92] mb-3">
        {headingLines.map((line, index) => (
          <span className="block" key={`${line}-${index}`}>{line}</span>
        ))}
      </h1>
      <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed mb-4 max-w-xs">{description}</p>
      {(phoneNumber || mobileNumber) && (
        <a
          href={`tel:${phoneNumber || mobileNumber}`}
          className="inline-flex items-center gap-2.5 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-5 py-3 mb-3 transition-colors duration-200 w-full sm:w-auto justify-center lg:justify-start"
        >
          <Phone className="h-4 w-4 shrink-0" />
          {phoneNumber && mobileNumber ? `${phoneNumber} / ${mobileNumber}` : phoneNumber || mobileNumber}
        </a>
      )}
      {emailAddress && (
        <a
          href={`mailto:${emailAddress}`}
          className="inline-flex items-center gap-2.5 bg-stone-700 hover:bg-stone-600 text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-wide px-5 py-3 transition-colors duration-200 w-full sm:w-auto justify-center lg:justify-start"
        >
          <Mail className="h-4 w-4 shrink-0" />
          {emailAddress}
        </a>
      )}
    </div>
  );
}

function ServiceStrip({ config }: { config: HomeHeroServiceConfig }) {
  return (
    <div className="bg-[var(--bg-dark-primary)] flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-4 md:px-10">
      <div>
        <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">{config.eyebrow}</p>
        <h2 className="text-[var(--text-light-primary)] text-2xl md:text-3xl font-black uppercase italic leading-none mb-2">{config.heading}</h2>
        <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed max-w-sm">{config.description}</p>
      </div>
      <Link
        href={config.href}
        className="shrink-0 inline-flex items-center gap-2 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors duration-200 whitespace-nowrap"
      >
        {config.linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function HomeHeroV2({
  newBikes,
  usedBikes,
  error,
  phoneNumber,
  mobileNumber,
  emailAddress,
  layout = 'dual',
  eyebrow = 'ScooterShop · Dianella, Perth',
  headingLines = ["Perth's", 'Motorcycle', '& Scooter', 'Specialists'],
  description = 'Mechanic and dealership for over 30 years. New and used sales, servicing, tyres, and repairs — petrol and electric models.',
  newPanel = defaultNewPanel,
  usedPanel = defaultUsedPanel,
  servicePanel = defaultServicePanel,
}: HomeHeroProps) {
  const textPanel = (
    <TextPanel
      eyebrow={eyebrow}
      headingLines={headingLines}
      description={description}
      phoneNumber={phoneNumber}
      mobileNumber={mobileNumber}
      emailAddress={emailAddress}
    />
  );

  if (layout === 'single') {
    return (
      <div className="w-full flex flex-col lg:flex-row min-h-[540px] lg:min-h-[600px]">
        <div className="order-1 lg:order-2 lg:w-[38%] flex flex-col">
          {textPanel}
          {!error ? (
            <InventoryPanel
              bikes={newBikes}
              config={newPanel}
              className="min-h-[260px] md:min-h-[300px] lg:flex-1"
              titleSize="text-2xl md:text-3xl lg:text-2xl xl:text-3xl"
              sizes="(max-width: 1024px) 100vw, 38vw"
              variant="small"
            />
          ) : (
            <div className="flex-1 min-h-[200px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
              Could not load images.
            </div>
          )}
        </div>
        <div className="order-2 lg:order-1 lg:flex-1 flex flex-col">
          {!error ? (
            <InventoryPanel
              bikes={usedBikes}
              config={usedPanel}
              priority
              className="flex-1 min-h-[360px] lg:min-h-0"
              titleSize="text-3xl md:text-4xl lg:text-5xl"
              sizes="(max-width: 1024px) 100vw, 62vw"
            />
          ) : (
            <div className="flex-1 min-h-[360px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
              Could not load images.
            </div>
          )}
          {servicePanel && <ServiceStrip config={servicePanel} />}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-[480px] md:min-h-[420px]">
      <div className="order-1 lg:order-2 lg:w-[38%] flex flex-col">
        {textPanel}
        {!error ? (
          <InventoryPanel
            bikes={usedBikes}
            config={usedPanel}
            priority
            className="min-h-[260px] md:min-h-[300px] lg:flex-1"
            titleSize="text-2xl md:text-3xl lg:text-2xl xl:text-3xl"
            sizes="(max-width: 1024px) 100vw, 38vw"
            variant="small"
          />
        ) : (
          <div className="flex-1 min-h-[200px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
            Could not load images.
          </div>
        )}
      </div>

      <div className="order-2 lg:order-1 lg:flex-1 flex flex-col">
        {!error ? (
          <InventoryPanel
            bikes={newBikes}
            config={newPanel}
            priority
            className="flex-1 min-h-[300px] lg:min-h-0"
            titleSize="text-3xl md:text-4xl lg:text-4xl xl:text-5xl"
            sizes="(max-width: 1024px) 100vw, 62vw"
          />
        ) : (
          <div className="flex-1 min-h-[300px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
            Could not load images.
          </div>
        )}

        {servicePanel && <ServiceStrip config={servicePanel} />}
      </div>
    </div>
  );
}
