import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MousePointerClick, KeyRound, Bike } from 'lucide-react';
import Seo from '@/components/Seo';
import { FaqSection } from '@/components/FaqSection';
import HireConfidenceSection from '@/components/HireConfidenceSection';
import HireAreasSection from '@/components/HireAreasSection';
import PayLaterSection from '@/components/PayLaterSection';
import { getHireBikes } from '@/api';
import type { Bike as BikeType } from '@/types/Bike';
import { siteSettings } from '@/config/siteSettings';
import { formatRate, hireFaqData } from '@/lib/hire';

const steps = [
    {
        number: '01',
        icon: CalendarDays,
        title: 'Pick Your Dates',
        description: 'Choose your start and end dates on our hire page. We offer daily, weekly, and monthly rates.',
    },
    {
        number: '02',
        icon: MousePointerClick,
        title: 'Choose Your Bike',
        description: 'Browse available bikes for your dates and select the one that suits you. Pay securely online.',
    },
    {
        number: '03',
        icon: KeyRound,
        title: 'Pick Up & Ride',
        description: 'Collect your bike from our workshop in Dianella and you\'re ready to go.',
    },
];



const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.scootershop.com.au/" },
                { "@type": "ListItem", "position": 2, "name": "Motorcycle Hire Perth", "item": "https://www.scootershop.com.au/motorcycle-hire" },
            ]
        },
        {
            "@type": "Service",
            "serviceType": "Motorcycle hire",
            "provider": {
                "@type": "LocalBusiness",
                "name": "Allbikes & Scooters",
                "url": "https://www.scootershop.com.au",
                "telephone": siteSettings.phone_number,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": siteSettings.street_address,
                    "addressLocality": siteSettings.address_locality,
                    "addressRegion": siteSettings.address_region,
                    "postalCode": siteSettings.postal_code,
                    "addressCountry": "AU"
                }
            },
            "areaServed": {
                "@type": "City",
                "name": "Perth",
                "addressRegion": "WA",
                "addressCountry": "AU"
            },
            "description": "Motorcycle hire in Perth from Allbikes & Scooters, Dianella. Flexible daily, weekly, and monthly rates. Refundable bond, maintained fleet, pick up from our workshop.",
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Hire Rates",
                "itemListElement": [
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Daily motorcycle hire" } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Weekly motorcycle hire" } },
                    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Monthly motorcycle hire" } }
                ]
            }
        }
    ]
};

interface SlotState { a: string; b: string; active: 'a' | 'b'; }

const HireLandingPage = () => {
    const [featuredBikes, setFeaturedBikes] = useState<BikeType[]>([]);
    const [slots, setSlots] = useState<SlotState | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const indexRef = useRef(0);
    const urlsRef = useRef<string[]>([]);

    useEffect(() => {
        getHireBikes()
            .then(bikes => {
                setFeaturedBikes(bikes.slice(0, 3));
                const urls = bikes.flatMap(bike => {
                    const sorted = [...bike.images].sort((a, b) => a.order - b.order);
                    const url = sorted[0]?.medium || sorted[0]?.image;
                    return url ? [url] : [];
                });
                if (urls.length > 0) {
                    urlsRef.current = urls;
                    setImageUrls(urls);
                    setSlots({ a: urls[0], b: urls[0], active: 'a' });
                }
            })
            .catch(() => { /* silently fail */ });
    }, []);

    useEffect(() => {
        if (imageUrls.length <= 1) return;
        const interval = setInterval(() => {
            const next = (indexRef.current + 1) % urlsRef.current.length;
            indexRef.current = next;
            const incoming = urlsRef.current[next];
            new Image().src = incoming;
            setSlots(s => {
                if (!s) return s;
                const nextSlot = s.active === 'a' ? 'b' : 'a';
                return { ...s, [nextSlot]: incoming, active: nextSlot };
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [imageUrls]);

    return (
        <div>
            <Seo
                title="Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop"
                description="Hire a motorcycle in Perth from Allbikes & Scooters, Dianella. Flexible daily, weekly, and monthly rates. Book online — refundable bond, maintained fleet."
                canonicalPath="/motorcycle-hire"
                structuredData={structuredData}
            />

            {/* Hero */}
            <section className="relative bg-[var(--bg-dark-primary)] min-h-[480px] flex items-center overflow-hidden">
                {/* Crossfading bike images */}
                {slots && (
                    <>
                        <img
                            src={slots.a}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'a' ? 'opacity-40' : 'opacity-0'}`}
                        />
                        <img
                            src={slots.b}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${slots.active === 'b' ? 'opacity-40' : 'opacity-0'}`}
                        />
                    </>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark-primary)] via-[var(--bg-dark-primary)]/60 to-[var(--bg-dark-primary)]/40" />

                {/* Content */}
                <div className="relative z-10 w-full px-6 py-20">
                    <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                        <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                            Allbikes &amp; Scooters · Dianella, Perth
                        </p>
                        <h1 className="text-[var(--text-light-primary)] text-5xl sm:text-6xl xl:text-7xl font-black uppercase italic leading-[0.9] mb-6">
                            Hire a Motorcycle<br />in Perth
                        </h1>
                        <p className="text-[var(--text-light-secondary)] text-lg leading-relaxed mb-10 max-w-xl">
                            Flexible daily, weekly, and monthly motorcycle hire from our workshop in Dianella.
                            Choose your bike, pick your dates, and book online.
                        </p>
                        <Link
                            to="/hire"
                            className="inline-flex items-center gap-2 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-wide px-8 py-4 transition-colors duration-200"
                        >
                            Check Availability
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="bg-[var(--bg-light-primary)] py-16 px-6 border-b border-[var(--border-light)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                            Simple Process
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-dark-primary)] leading-none">
                            How It Works
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map(({ number, icon: Icon, title, description }) => (
                            <div key={number} className="flex flex-col items-center text-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full bg-[var(--bg-light-secondary)] flex items-center justify-center">
                                        <Icon className="h-6 w-6 text-[var(--highlight)]" />
                                    </div>
                                    <span className="absolute -top-1 -right-2 text-[10px] font-black text-[var(--highlight)] tracking-widest">
                                        {number}
                                    </span>
                                </div>
                                <h3 className="font-black uppercase tracking-wide text-[var(--text-dark-primary)] text-sm">
                                    {title}
                                </h3>
                                <p className="text-[var(--text-dark-secondary)] text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured hire bikes */}
            {featuredBikes.length > 0 && (
                <section className="bg-[var(--bg-dark-primary)] py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 text-center sm:text-left">
                            <div>
                                <p className="text-[var(--highlight)] text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                                    Available Now
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-light-primary)] leading-none">
                                    Featured Hire Bikes
                                </h2>
                            </div>
                            <Link
                                to="/hire"
                                className="hidden sm:inline-flex items-center gap-2 shrink-0 border border-amber-400 text-[var(--highlight)] hover:border-stone-500 hover:text-[var(--text-light-secondary)] font-bold text-xs uppercase tracking-widest px-4 py-2.5 transition-colors duration-200"
                            >
                                Check Availability <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {featuredBikes.map((bike) => {
                                const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
                                const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image || null;
                                const bikeName = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
                                return (
                                    <Link
                                        key={bike.id}
                                        to="/hire"
                                        className="group bg-[var(--bg-light-primary)] rounded-lg overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-200"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-light-secondary)]">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={bikeName}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Bike className="h-10 w-10 text-[var(--text-dark-secondary)]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-4 flex flex-col gap-1 flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">{bike.make}</p>
                                            <p className="font-bold text-[var(--text-dark-primary)] text-base leading-snug">{bikeName}</p>
                                            <div className="mt-auto pt-2 flex items-end justify-between">
                                                <span className="text-[var(--text-dark-primary)] font-black text-lg">{formatRate(bike)}</span>
                                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--highlight)] group-hover:underline">
                                                    Book →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        <Link
                            to="/hire"
                            className="sm:hidden inline-flex items-center gap-2 bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-widest px-6 py-3 transition-colors duration-200"
                        >
                            Check Availability
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            )}

            <HireConfidenceSection />

            <HireAreasSection />

            <PayLaterSection />

            <FaqSection title="Hire FAQs" faqData={hireFaqData} />
        </div>
    );
};

export default HireLandingPage;
