import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { HomeHeroProps } from "@/types/HomeHeroProps";
import { ArrowRight, Phone, Mail } from 'lucide-react';

// Import default images
import defaultNewImage from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ.webp';
import defaultUsedImage from '@/assets/IMG_20250730_102056.webp';

// Import responsive images for New
import defaultNewImage320 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-320w.webp';
import defaultNewImage640 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-640w.webp';
import defaultNewImage768 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-768w.webp';
import defaultNewImage1024 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-1024w.webp';
import defaultNewImage1280 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-1280w.webp';

// Import responsive images for Used
import defaultUsedImage320 from '@/assets/IMG_20250730_102056-320w.webp';
import defaultUsedImage640 from '@/assets/IMG_20250730_102056-640w.webp';
import defaultUsedImage768 from '@/assets/IMG_20250730_102056-768w.webp';
import defaultUsedImage1024 from '@/assets/IMG_20250730_102056-1024w.webp';
import defaultUsedImage1280 from '@/assets/IMG_20250730_102056-1280w.webp';

const defaultNewSrcSet = `${defaultNewImage320} 320w, ${defaultNewImage640} 640w, ${defaultNewImage768} 768w, ${defaultNewImage1024} 1024w, ${defaultNewImage1280} 1280w`;
const defaultUsedSrcSet = `${defaultUsedImage320} 320w, ${defaultUsedImage640} 640w, ${defaultUsedImage768} 768w, ${defaultUsedImage1024} 1024w, ${defaultUsedImage1280} 1280w`;

interface SlotState {
  a: string;
  b: string;
  active: 'a' | 'b';
}

const HomeHeroV2 = ({ newBikes, usedBikes, error, phoneNumber, mobileNumber, emailAddress }: HomeHeroProps) => {
  const [newBikeImageUrls, setNewBikeImageUrls] = useState<string[]>([defaultNewImage]);
  const [usedBikeImageUrls, setUsedBikeImageUrls] = useState<string[]>([defaultUsedImage]);
  const currentNewIndexRef = useRef(0);
  const currentUsedIndexRef = useRef(0);

  // Two-slot crossfade state: one slot holds the outgoing image, one the incoming
  const [newSlots, setNewSlots] = useState<SlotState>({ a: defaultNewImage, b: defaultNewImage, active: 'a' });
  const [usedSlots, setUsedSlots] = useState<SlotState>({ a: defaultUsedImage, b: defaultUsedImage, active: 'a' });

  // Refs so interval callbacks always see latest URL arrays
  const newUrlsRef = useRef(newBikeImageUrls);
  const usedUrlsRef = useRef(usedBikeImageUrls);
  useEffect(() => { newUrlsRef.current = newBikeImageUrls; }, [newBikeImageUrls]);
  useEffect(() => { usedUrlsRef.current = usedBikeImageUrls; }, [usedBikeImageUrls]);

  useEffect(() => {
    if (newBikes.length > 0) {
      const urls = newBikes.map(bike => {
        const sorted = [...bike.images].sort((a, b) => a.order - b.order);
        return sorted[0]?.medium || sorted[0]?.image;
      }).filter(Boolean) as string[];
      if (urls.length > 0) {
        setNewBikeImageUrls(urls);
        setNewSlots({ a: urls[0], b: urls[0], active: 'a' });
        currentNewIndexRef.current = 0;
      }
    }
  }, [newBikes]);

  useEffect(() => {
    if (usedBikes.length > 0) {
      const urls = usedBikes.map(bike => {
        const sorted = [...bike.images].sort((a, b) => a.order - b.order);
        return sorted[0]?.medium || sorted[0]?.image;
      }).filter(Boolean) as string[];
      if (urls.length > 0) {
        setUsedBikeImageUrls(urls);
        setUsedSlots({ a: urls[0], b: urls[0], active: 'a' });
        currentUsedIndexRef.current = 0;
      }
    }
  }, [usedBikes]);

  // Image cycling with crossfade for New
  useEffect(() => {
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
  }, [newBikeImageUrls]);

  // Image cycling with crossfade for Used
  useEffect(() => {
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
  }, [usedBikeImageUrls]);

  const renderCrossfadeImages = (
    slots: SlotState,
    isDefaultA: boolean,
    isDefaultB: boolean,
    priority?: boolean
  ) => (
    <>
      <img
        src={slots.a}
        srcSet={isDefaultA ? defaultNewSrcSet : undefined}
        sizes="(max-width: 768px) 100vw, 60vw"
        alt=""
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-100' : 'opacity-0'}`}
        {...(priority ? { fetchPriority: 'high' as const } : {})}
      />
      <img
        src={slots.b}
        srcSet={isDefaultB ? defaultNewSrcSet : undefined}
        sizes="(max-width: 768px) 100vw, 60vw"
        alt=""
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );

  const renderUsedCrossfadeImages = (slots: SlotState, isDefaultA: boolean, isDefaultB: boolean) => (
    <>
      <img
        src={slots.a}
        srcSet={isDefaultA ? defaultUsedSrcSet : undefined}
        sizes="(max-width: 768px) 100vw, 40vw"
        alt=""
        fetchPriority="high"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-100' : 'opacity-0'}`}
      />
      <img
        src={slots.b}
        srcSet={isDefaultB ? defaultUsedSrcSet : undefined}
        sizes="(max-width: 768px) 100vw, 40vw"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );

  const newIsDefaultA = newSlots.a === defaultNewImage;
  const newIsDefaultB = newSlots.b === defaultNewImage;
  const usedIsDefaultA = usedSlots.a === defaultUsedImage;
  const usedIsDefaultB = usedSlots.b === defaultUsedImage;

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-[600px] lg:min-h-[700px]">

      {/* ── TEXT PANEL (mobile: order 1, desktop: order 2 / right-top) ── */}
      <div className="order-1 lg:order-2 lg:w-[38%] flex flex-col">
        <div className="bg-[var(--bg-dark-primary)] flex flex-col justify-center items-center lg:items-start px-8 py-10 md:px-10 md:py-12 flex-1 text-center lg:text-left">
          <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-5">
            Allbikes &amp; Scooters &nbsp;·&nbsp; Dianella, Perth
          </p>
          <h1 className="text-[var(--text-light-primary)] text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black uppercase italic leading-[0.92] mb-6">
            Perth's<br />
            Motorcycle<br />
            &amp; Scooter<br />
            Specialists
          </h1>
          <p className="text-[var(--text-light-secondary)] text-sm leading-relaxed mb-8 max-w-xs">
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
            to="/inventory/motorcycles/used"
            className="relative group overflow-hidden min-h-[260px] lg:flex-1"
          >
            {renderUsedCrossfadeImages(usedSlots, usedIsDefaultA, usedIsDefaultB)}
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
            to="/inventory/motorcycles/new"
            className="relative flex-1 group overflow-hidden min-h-[300px] lg:min-h-0 bg-[var(--bg-dark-primary)]"
          >
            {renderCrossfadeImages(newSlots, newIsDefaultA, newIsDefaultB, true)}
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
        <div className="bg-[var(--bg-dark-primary)] flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-8 md:px-10">
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
            to="/booking"
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
