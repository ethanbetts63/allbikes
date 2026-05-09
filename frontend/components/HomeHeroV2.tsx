"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import type { HomeHeroProps } from "@/types/HomeHeroProps";
import { ArrowRight, Phone, Mail } from 'lucide-react';

// Import default images
import defaultNewImage from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ.webp';
import defaultUsedImage from '@/assets/IMG_20250730_102056.webp';

const defaultNewImageSrc = defaultNewImage.src;
const defaultUsedImageSrc = defaultUsedImage.src;

interface SlotState {
  a: string;
  b: string;
  active: 'a' | 'b';
}

const getBikeImageUrls = (bikes: HomeHeroProps['newBikes'], fallback: string) => {
  const urls = bikes.map(bike => {
    const sorted = [...bike.images].sort((a, b) => a.order - b.order);
    return sorted[0]?.medium || sorted[0]?.image;
  }).filter(Boolean) as string[];

  return urls.length > 0 ? urls : [fallback];
};

const HomeHeroV2 = ({ newBikes, usedBikes, error, phoneNumber, mobileNumber, emailAddress }: HomeHeroProps) => {
  const newBikeImageUrls = useMemo(() => getBikeImageUrls(newBikes, defaultNewImageSrc), [newBikes]);
  const usedBikeImageUrls = useMemo(() => getBikeImageUrls(usedBikes, defaultUsedImageSrc), [usedBikes]);
  const [shouldCycleImages, setShouldCycleImages] = useState(false);
  const currentNewIndexRef = useRef(0);
  const currentUsedIndexRef = useRef(0);

  // Two-slot crossfade state: one slot holds the outgoing image, one the incoming
  const [newSlots, setNewSlots] = useState<SlotState>({ a: newBikeImageUrls[0], b: newBikeImageUrls[0], active: 'a' });
  const [usedSlots, setUsedSlots] = useState<SlotState>({ a: usedBikeImageUrls[0], b: usedBikeImageUrls[0], active: 'a' });

  // Refs so interval callbacks always see latest URL arrays
  const newUrlsRef = useRef(newBikeImageUrls);
  const usedUrlsRef = useRef(usedBikeImageUrls);
  useEffect(() => { newUrlsRef.current = newBikeImageUrls; }, [newBikeImageUrls]);
  useEffect(() => { usedUrlsRef.current = usedBikeImageUrls; }, [usedBikeImageUrls]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateShouldCycle = () => setShouldCycleImages(mediaQuery.matches);

    updateShouldCycle();
    mediaQuery.addEventListener('change', updateShouldCycle);

    return () => mediaQuery.removeEventListener('change', updateShouldCycle);
  }, []);

  // Image cycling with crossfade for New
  useEffect(() => {
    if (!shouldCycleImages) return;
    if (newBikeImageUrls.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentNewIndexRef.current + 1) % newUrlsRef.current.length;
      currentNewIndexRef.current = next;
      const incoming = newUrlsRef.current[next];
      new Image().src = incoming;
      setNewSlots(s => {
        const nextSlot = s.active === 'a' ? 'b' : 'a';
        return { ...s, [nextSlot]: incoming, active: nextSlot };
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [newBikeImageUrls, shouldCycleImages]);

  // Image cycling with crossfade for Used
  useEffect(() => {
    if (!shouldCycleImages) return;
    if (usedBikeImageUrls.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentUsedIndexRef.current + 1) % usedUrlsRef.current.length;
      currentUsedIndexRef.current = next;
      const incoming = usedUrlsRef.current[next];
      new Image().src = incoming;
      setUsedSlots(s => {
        const nextSlot = s.active === 'a' ? 'b' : 'a';
        return { ...s, [nextSlot]: incoming, active: nextSlot };
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [usedBikeImageUrls, shouldCycleImages]);

  const renderCrossfadeImages = (
    slots: SlotState,
    priority?: boolean
  ) => (
    <>
      <NextImage
        src={slots.a}
        sizes="60vw"
        alt="New motorcycles and scooters for sale at ScooterShop Perth"
        fill
        priority={priority}
        className={`object-contain transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-100' : 'opacity-0'}`}
      />
      <NextImage
        src={slots.b}
        sizes="60vw"
        alt="New motorcycles and scooters for sale at ScooterShop Perth"
        fill
        className={`object-contain transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );

  const renderUsedCrossfadeImages = (slots: SlotState) => (
    <>
      <NextImage
        src={slots.a}
        sizes="40vw"
        alt="Used motorcycles and scooters for sale at ScooterShop Perth"
        fill
        className={`object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-100' : 'opacity-0'}`}
      />
      <NextImage
        src={slots.b}
        sizes="40vw"
        alt="Used motorcycles and scooters for sale at ScooterShop Perth"
        fill
        className={`object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );

  const renderNewHeroImages = () => (
    <>
      <span className="absolute inset-0 md:hidden">
        <NextImage
          src={newBikeImageUrls[0]}
          sizes="100vw"
          alt="New motorcycles and scooters for sale at ScooterShop Perth"
          fill
          priority
          className="object-contain"
        />
      </span>
      <span className="absolute inset-0 hidden md:block">
        {renderCrossfadeImages(newSlots)}
      </span>
    </>
  );

  const renderUsedHeroImages = () => (
    <>
      <span className="absolute inset-0 md:hidden">
        <NextImage
          src={usedBikeImageUrls[0]}
          sizes="100vw"
          alt="Used motorcycles and scooters for sale at ScooterShop Perth"
          fill
          className="object-cover"
        />
      </span>
      <span className="absolute inset-0 hidden md:block">
        {renderUsedCrossfadeImages(usedSlots)}
      </span>
    </>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-[480px] md:min-h-[420px]">

      {/* ── TEXT PANEL (mobile: order 1, desktop: order 2 / right-top) ── */}
      <div className="order-1 lg:order-2 lg:w-[38%] flex flex-col">
        <div className="bg-[var(--bg-dark-primary)] flex flex-col justify-center items-center lg:items-start px-8 py-4 md:px-10 md:py-5 flex-1 text-center lg:text-left">
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-2">
            Allbikes &amp; Scooters &nbsp;·&nbsp; Dianella, Perth
          </p>
          <h1 className="text-[var(--text-light-primary)] text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black uppercase italic leading-[0.92] mb-3">
            Perth's<br />
            Motorcycle<br />
            &amp; Scooter<br />
            Specialists
          </h1>
          <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed mb-4 max-w-xs">
            Mechanic and dealership for over 30 years. New and used sales, servicing, tyres, and repairs — petrol and electric models.
          </p>
          {/* Contact buttons styled to match the dark panel */}
          {(phoneNumber || mobileNumber) && (
            <a
              href={`tel:${phoneNumber || mobileNumber}`}
              className="inline-flex items-center gap-2.5 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-5 py-3 mb-3 transition-colors duration-200 w-full sm:w-auto justify-center lg:justify-start"
            >
              <Phone className="h-4 w-4 shrink-0" />
              {phoneNumber && mobileNumber ? `${phoneNumber} / ${mobileNumber}` : (phoneNumber || mobileNumber)}
            </a>
          )}
          {emailAddress && (
            <a
              href={`mailto:${emailAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-stone-700 hover:bg-stone-600 text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-wide px-5 py-3 transition-colors duration-200 w-full sm:w-auto justify-center lg:justify-start"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {emailAddress}
            </a>
          )}
        </div>

        {/* ── USED BIKES PANEL ── */}
        {!error ? (
          <Link
            href="/inventory/motorcycles/used"
            className="relative group overflow-hidden min-h-[260px] md:min-h-[300px] lg:flex-1"
          >
            {renderUsedHeroImages()}
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-[var(--bg-dark-primary)]/20 group-hover:bg-transparent transition-colors duration-300" />
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-7">
              <p className="text-[var(--highlight)] text-[9px] font-bold uppercase tracking-[0.25em] mb-2">
                Browse Inventory
              </p>
              <h2 className="text-[var(--text-light-primary)] text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-black uppercase italic leading-none mb-4">
                Used<br />
                <span className="hidden md:inline">Motorcycles &amp; Scooters</span>
                <span className="md:hidden">Bikes</span>
              </h2>
              <span className="inline-flex items-center text-[var(--text-light-primary)]/70 font-bold text-xs uppercase tracking-widest border-b border-white/30 pb-0.5 group-hover:text-[var(--highlight)] group-hover:border-amber-400 transition-colors duration-200">
                Shop Now
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex-1 min-h-[200px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
            Could not load images.
          </div>
        )}
      </div>

      {/* ── LEFT COLUMN: new bikes image + service strip ── */}
      <div className="order-2 lg:order-1 lg:flex-1 flex flex-col">

        {/* New bikes image */}
        {!error ? (
          <Link
            href="/inventory/motorcycles/new"
            className="relative flex-1 group overflow-hidden min-h-[300px] lg:min-h-0 bg-[var(--bg-dark-primary)]"
          >
            {renderNewHeroImages()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
            <div className="absolute inset-0 bg-[var(--bg-dark-primary)]/30 group-hover:bg-transparent transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 p-7 md:p-9">
              <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                Browse Inventory
              </p>
              <h2 className="text-[var(--text-light-primary)] text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black uppercase italic leading-none mb-4">
                New<br />
                <span className="hidden md:inline">Motorcycles<br />&amp; Scooters</span>
                <span className="md:hidden">Bikes</span>
              </h2>
              <span className="inline-flex items-center text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-widest border-b border-white/40 pb-0.5 group-hover:text-[var(--highlight)] group-hover:border-amber-400 transition-colors duration-200">
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex-1 min-h-[300px] flex items-center justify-center bg-[var(--bg-dark-secondary)] text-[var(--text-light-secondary)] text-sm p-4 text-center">
            Could not load images.
          </div>
        )}

        {/* Service strip */}
        <div className="bg-[var(--bg-dark-primary)] flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-4 md:px-10">
          <div>
            <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
              Allbikes Workshop &nbsp;·&nbsp; Perth
            </p>
            <h2 className="text-[var(--text-light-primary)] text-2xl md:text-3xl font-black uppercase italic leading-none mb-2">
              Get Your Bike Serviced.
            </h2>
            <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed max-w-sm">
              Servicing, tyres, puncture repairs, and general maintenance — petrol and electric.
            </p>
          </div>
          <Link
            href="/service-booking"
            className="shrink-0 inline-flex items-center gap-2 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-6 py-3 transition-colors duration-200 whitespace-nowrap"
          >
            Book Online
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

    </div>
  );
};

export default HomeHeroV2;
