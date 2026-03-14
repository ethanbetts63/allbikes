import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBikeById, getBikes } from '@/api';
import type { Bike } from '@/types/Bike';
import type { Specification } from '@/types/Specification';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import FeaturedBikes from "@/components/FeaturedBikes";
import YouTube from 'react-youtube';
import {
    Hash,
    Gauge,
    Cog,
    Calendar,
    GitCommit,
    FileText,
    CalendarClock,
    ShieldCheck,
    PlayCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BreadcrumbItem } from '@/types/BreadcrumbItem';

const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) return videoId;
        }
    } catch (error) {
        console.error("Invalid YouTube URL:", error);
        return null;
    }
    return null;
};

const BikeDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<string>('YOUTUBE');
    const [newBikes, setNewBikes] = useState<Bike[]>([]);
    const [usedBikes, setUsedBikes] = useState<Bike[]>([]);

    const videoId = bike?.youtube_link ? getYouTubeVideoId(bike.youtube_link) : null;

    useEffect(() => {
        if (!slug) return;

        if (/^\d+$/.test(slug)) {
            setError("Page not found.");
            setIsLoading(false);
            return;
        }

        const id = slug.split('-').pop();
        if (!id) {
            setError("Invalid bike identifier.");
            setIsLoading(false);
            return;
        }

        const fetchBike = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getBikeById(id);

                const sortedImages = [...data.images].sort((a, b) => a.order - b.order);
                data.images = sortedImages;

                setBike(data);

                if (data.youtube_link && getYouTubeVideoId(data.youtube_link)) {
                    setSelectedMedia('YOUTUBE');
                } else if (data.images && data.images.length > 0) {
                    setSelectedMedia(data.images[0].image);
                } else {
                    setSelectedMedia('/src/assets/motorcycle_images/placeholder.png');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchFeaturedBikes = async () => {
            try {
                const newBikesData = await getBikes({ condition: 'new', page: 1, is_featured: true });
                setNewBikes(newBikesData.results);

                const usedBikesData = await getBikes({ condition: 'used', page: 1, is_featured: true });
                const demoBikesData = await getBikes({ condition: 'demo', page: 1, is_featured: true });
                setUsedBikes([...usedBikesData.results, ...demoBikesData.results]);
            } catch (error) {
                console.error("Failed to fetch featured bikes:", error);
            }
        };

        fetchBike();
        fetchFeaturedBikes();
    }, [slug]);

    const sortedImages = useMemo(() => {
        if (!bike?.images) return [];
        return [...bike.images].sort((a, b) => a.order - b.order);
    }, [bike]);

    const specifications: Specification[] = bike ? [
        { label: "Stock Number", value: bike.stock_number, icon: Hash },
        { label: "Odometer", value: bike.odometer, icon: Gauge, formatter: (val: number) => `${val.toLocaleString()} km` },
        { label: "Engine Size", value: bike.engine_size, icon: Cog, formatter: (val: number) => `${val}cc` },
        { label: "Year", value: bike.year, icon: Calendar },
        { label: "Transmission", value: bike.transmission, icon: GitCommit },
        { label: "Registration", value: bike.rego, icon: FileText },
        { label: "Rego Expiry", value: bike.rego_exp, icon: CalendarClock },
        { label: "Warranty", value: bike.warranty_months, icon: ShieldCheck, formatter: (val: number) => `${val} months` },
    ] : [];

    const pageTitle = bike ? `${bike.year || ''} ${bike.make} ${bike.model}`.trim() : 'Bike Details';

    const ogImage = selectedMedia === 'YOUTUBE' && videoId
        ? `https://img.youtube.com/vi/${videoId}/0.jpg`
        : (selectedMedia !== 'YOUTUBE' ? selectedMedia : '/src/assets/motorcycle_images/placeholder.png');

    const breadcrumbItems: BreadcrumbItem[] = bike ? [
        { name: 'Home', href: '/' },
        { name: bike.condition === 'new' ? 'New Bikes' : 'Used Bikes', href: `/bikes/${bike.condition}` },
        { name: pageTitle, href: `/inventory/motorcycles/${bike.slug}` }
    ] : [];

    const structuredData = bike ? {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbItems.map((item, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": item.name,
                    "item": `https://www.scootershop.com.au${item.href}`
                }))
            },
            {
                "@type": "Product",
                "name": pageTitle,
                "image": bike.images.length > 0 ? `https://www.scootershop.com.au${bike.images[0].image}` : `https://www.scootershop.com.au/src/assets/motorcycle_images/placeholder.png`,
                "description": bike.description,
                "sku": bike.stock_number,
                "brand": {
                    "@type": "Brand",
                    "name": bike.make
                },
                "offers": {
                    "@type": "Offer",
                    "price": bike.price,
                    "priceCurrency": "AUD",
                    "availability": bike.status === 'for_sale' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    "itemCondition": bike.condition.toLowerCase() === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
                    "url": `https://www.scootershop.com.au/inventory/motorcycles/${bike.slug}`
                },
                ...(videoId && {
                    "video": {
                        "@type": "VideoObject",
                        "name": `${pageTitle} - Walkthrough`,
                        "description": bike.description,
                        "thumbnailUrl": `https://img.youtube.com/vi/${videoId}/0.jpg`,
                        "embedUrl": `https://www.youtube.com/embed/${videoId}`,
                        "uploadDate": bike.date_posted
                    }
                }),
                "vehicle": {
                    "@type": "Vehicle",
                    "vehicleIdentificationNumber": bike.rego,
                    "mileageFromOdometer": {
                        "@type": "QuantitativeValue",
                        "value": bike.odometer,
                        "unitCode": "KMT"
                    },
                    "engineDisplacement": {
                        "@type": "QuantitativeValue",
                        "value": bike.engine_size,
                        "unitText": "cc"
                    },
                    "vehicleModelDate": bike.year,
                    "vehicleTransmission": bike.transmission
                }
            }
        ]
    } : undefined;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive text-center mt-8">{error}</p>;
    }

    if (!bike) {
        return <p className="text-center mt-8 text-[var(--text-dark-secondary)]">Bike not found.</p>;
    }

    const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    return (
        <div className="bg-white text-[var(--text-dark-primary)]">
            <Seo
                title={`${pageTitle} | Allbikes`}
                description={bike.description || `Check out the ${pageTitle} at Allbikes & Scooters, Perth's most experienced motorcycle and scooter dealership.`}
                canonicalPath={`/inventory/motorcycles/${bike.slug}`}
                ogImage={ogImage}
                structuredData={structuredData}
            />


            <div className="container mx-auto px-4 pb-12 lg:px-8">

                {/* Title + badges */}
                <div className="mb-6 pt-4">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-dark-primary)] leading-tight mb-3">{cardTitle}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Condition */}
                        <span className="bg-stone-900/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            {bike.condition}
                        </span>
                        {/* Status */}
                        {bike.status === 'sold' && (
                            <span className="bg-stone-900/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Sold
                            </span>
                        )}
                        {bike.status === 'reserved' && (
                            <span className="bg-stone-900/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Reserved
                            </span>
                        )}
                        {bike.status === 'available_soon' && (
                            <span className="bg-stone-900/80 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Coming Soon
                            </span>
                        )}
                    </div>
                    {bike.status === 'available_soon' && (
                        <p className="mt-3 text-sm text-[var(--text-dark-secondary)] max-w-lg">
                            This bike is currently being inspected by our mechanic. It's not quite ready for sale yet — if you're interested feel free to{' '}
                            <Link to="/contact" className="text-amber-500 underline hover:text-amber-600">get in touch</Link> and we'll keep you in the loop.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-stone-100">
                            {selectedMedia === 'YOUTUBE' && videoId ? (
                                <YouTube videoId={videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                            ) : (
                                <img src={selectedMedia} alt={cardTitle} className="w-full h-full object-cover" />
                            )}
                            {/* Status overlay pill on main image */}
                            {bike.status === 'sold' && (
                                <span className="absolute top-4 left-4 bg-stone-900/80 text-[var(--text-light-primary)] text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-sm">
                                    Sold
                                </span>
                            )}
                            {bike.status === 'reserved' && (
                                <span className="absolute top-4 left-4 bg-stone-900/80 text-[var(--highlight)] text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-sm">
                                    Reserved
                                </span>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        <div className="flex gap-2 flex-wrap">
                            {videoId && (
                                <button
                                    onClick={() => setSelectedMedia('YOUTUBE')}
                                    className={`relative w-20 h-20 overflow-hidden rounded-md ${selectedMedia === 'YOUTUBE' ? 'ring-2 ring-amber-400' : 'ring-1 ring-stone-200'}`}
                                >
                                    <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt="YouTube video thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <PlayCircle className="h-8 w-8 text-[var(--text-light-primary)]" />
                                    </div>
                                </button>
                            )}
                            {sortedImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedMedia(img.image)}
                                    className={`w-20 h-20 overflow-hidden rounded-md ${selectedMedia === img.image ? 'ring-2 ring-amber-400' : 'ring-1 ring-stone-200'}`}
                                >
                                    <img src={img.image} alt={`${cardTitle} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Specifications & Description */}
                    <div>
                        {/* Price */}
                        <div className="mb-6 pb-4 border-b border-stone-200">
                            {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-semibold text-[var(--highlight)]">
                                        ${parseFloat(bike.discount_price).toLocaleString()}
                                    </span>
                                    <span className="text-xl text-stone-400 line-through">
                                        ${parseFloat(bike.price).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-4xl font-semibold text-[var(--text-dark-primary)]">
                                    ${parseFloat(bike.price).toLocaleString()}
                                </span>
                            )}
                            {bike.condition === 'new' && (
                                <p className="text-sm text-[var(--text-dark-secondary)] mt-1">
                                    {bike.warranty_months && bike.warranty_months > 0
                                        ? `Includes 3 months rego & ${bike.warranty_months} months warranty`
                                        : 'Includes 3 months rego'}
                                </p>
                            )}
                        </div>

                        {/* Specifications */}
                        <div className="mb-8">
                            <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">Specifications</h2>
                            <ul className="divide-y divide-stone-100">
                                {specifications.map((spec) => {
                                    if (spec.value === null || spec.value === undefined || spec.value === '') return null;
                                    const displayValue = spec.formatter ? spec.formatter(spec.value) : spec.value;
                                    return (
                                        <li key={spec.label} className="flex justify-between items-center py-2.5">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="flex items-center gap-2 text-[var(--text-dark-secondary)]">
                                                        <spec.icon className="h-4 w-4" />
                                                        <span className="text-sm">{spec.label}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{spec.label}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <span className="text-[var(--text-dark-primary)] font-semibold text-sm">{displayValue}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">Description</h2>
                            <p className="text-[var(--text-dark-secondary)] leading-relaxed text-sm">
                                {bike.description || 'No description available.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured bikes carousels */}
            <div className="mt-4 mb-4">
                {bike.condition.toLowerCase() === 'new' && newBikes.length > 0 && (
                    <FeaturedBikes
                        title={<>Featured <span className="hidden md:inline">New Motorcycles & Scooters</span><span className="md:hidden">New Bikes</span></>}
                        bikes={newBikes}
                        description="Check out our latest models, fresh from the factory."
                        linkTo="/inventory/motorcycles/new"
                        linkText="View All New"
                    />
                )}
                {(bike.condition.toLowerCase() === 'used' || bike.condition.toLowerCase() === 'demo') && usedBikes.length > 0 && (
                    <FeaturedBikes
                        title="Featured Used & Demo Bikes"
                        bikes={usedBikes}
                        description="Great value pre-owned and demonstrator bikes."
                        linkTo="/inventory/used"
                        linkText="View All Used"
                    />
                )}
            </div>
        </div>
    );
};

export default BikeDetailPage;
