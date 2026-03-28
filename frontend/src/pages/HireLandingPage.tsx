import { useState, useEffect } from 'react';
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

const formatRate = (bike: BikeType): string => {
    const candidates: number[] = [];
    if (bike.daily_rate && parseFloat(bike.daily_rate) > 0) candidates.push(parseFloat(bike.daily_rate));
    if (bike.weekly_rate && parseFloat(bike.weekly_rate) > 0) candidates.push(parseFloat(bike.weekly_rate) / 7);
    if (bike.monthly_rate && parseFloat(bike.monthly_rate) > 0) candidates.push(parseFloat(bike.monthly_rate) / 30);
    if (candidates.length === 0) return 'Contact for rates';
    return `From $${Math.min(...candidates).toFixed(0)}/day`;
};

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


const faqData = [
    {
        question: 'Do I need a motorcycle licence to hire a bike?',
        answer: 'No. You only need a motorcycle licence to ride bikes larger than 50cc. We have a range of scooters and small bikes that can be hired with a car licence. Please check the specific requirements for each bike on our hire page.',
    },
    {
        question: 'How does the bond work?',
        answer: 'A refundable bond is charged at the time of payment along with your hire total. It is returned in full once the bike is back with us in good condition.',
    },
    {
        question: 'What is included in the hire?',
        answer: 'The hire fee covers the use of the motorcycle for your chosen period. The bike comes serviced and ready to ride. Fuel is not included — you return the bike with the same amount of fuel as when you collected it.',
    },
    {
        question: 'Can I extend my hire period?',
        answer: 'Extensions are subject to availability. Contact us as early as possible if you need to extend and we\'ll do our best to accommodate you.',
    },
    {
        question: 'What happens if I damage the bike?',
        answer: 'Any damage beyond normal wear and tear will be assessed and deducted from your bond. Significant damage may incur additional costs. Our hire terms and conditions cover this in detail.',
    }
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

const HireLandingPage = () => {
    const [featuredBikes, setFeaturedBikes] = useState<BikeType[]>([]);

    useEffect(() => {
        getHireBikes()
            .then(bikes => setFeaturedBikes(bikes.slice(0, 3)))
            .catch(() => { /* silently fail */ });
    }, []);

    return (
        <div>
            <Seo
                title="Motorcycle Hire Perth | Daily, Weekly & Monthly | Allbikes"
                description="Hire a motorcycle in Perth from Allbikes & Scooters, Dianella. Flexible daily, weekly, and monthly rates. Book online — refundable bond, maintained fleet."
                canonicalPath="/motorcycle-hire"
                structuredData={structuredData}
            />

            {/* Hero */}
            <section className="bg-[var(--bg-dark-primary)] py-20 px-6">
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

            <FaqSection title="Hire FAQs" faqData={faqData} />
        </div>
    );
};

export default HireLandingPage;
