import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBikeById, getBikes, getDepositSettings } from '@/api';
import type { Bike } from '@/types/Bike';
import type { Specification } from '@/types/Specification';
import Seo from '@/components/Seo';
import FeaturedBikes from "@/components/FeaturedBikes";
import {
    Hash,
    Gauge,
    Cog,
    Calendar,
    GitCommit,
    FileText,
    CalendarClock,
    ShieldCheck,
    Mail,
    Phone
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import clickIcon from '@/assets/click.svg';
import type { BreadcrumbItem } from '@/types/BreadcrumbItem';
import { siteSettings } from '@/config/siteSettings';
import PayLaterSection from '@/components/PayLaterSection';
import MediaGallery from '@/components/MediaGallery';
import PriceDisplay from '@/components/PriceDisplay';
import { LoadingScreen, ErrorScreen } from '@/components/DetailPageStates';
import { getYouTubeVideoId } from '@/utils/youtube';

const BikeDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<string>('YOUTUBE');
    const [newBikes, setNewBikes] = useState<Bike[]>([]);
    const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
    const [depositAmount, setDepositAmount] = useState<string | null>(null);

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

                if ((data.condition === 'new' || data.condition === 'demo') && data.status === 'for_sale') {
                    getDepositSettings().then(s => setDepositAmount(s.deposit_amount)).catch(() => {});
                }

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

    if (isLoading) return <LoadingScreen />;
    if (error) return <ErrorScreen message={error} />;
    if (!bike) return <ErrorScreen message="Bike not found." />;

    const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    const bikeSubtitle = bike.condition === 'new'
        ? <p className="text-sm text-[var(--text-dark-secondary)]">
            {bike.warranty_months && bike.warranty_months > 0
                ? `Includes 3 months rego & ${bike.warranty_months} months warranty`
                : 'Includes 3 months rego'}
          </p>
        : undefined;

    const statusOverlay = (bike.status === 'sold' || bike.status === 'reserved') ? (
        <span className={`absolute top-4 left-4 bg-[var(--bg-dark-primary)]/80 text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-sm ${bike.status === 'reserved' ? 'text-[var(--highlight)]' : 'text-[var(--text-light-primary)]'}`}>
            {bike.status === 'reserved' ? 'Reserved' : 'Sold'}
        </span>
    ) : undefined;

    return (
        <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)]">
            {/* Contact banner */}
            <div className="bg-[var(--bg-dark-primary)] border-b border-white/10">
                <div className="container mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="text-[var(--text-light-secondary)] text-xs uppercase tracking-widest font-bold hidden sm:inline">Interested?</span>
                    {siteSettings.phone_number && (
                        <a href={`tel:${siteSettings.phone_number}`} className="flex items-center gap-2 text-[var(--text-light-primary)] hover:text-[var(--highlight)] transition-colors text-sm font-semibold">
                            <Phone className="h-3.5 w-3.5 text-[var(--highlight)]" />
                            {siteSettings.phone_number}{siteSettings.mobile_number && ` / ${siteSettings.mobile_number}`}
                        </a>
                    )}
                    {siteSettings.email_address && (
                        <a href={`mailto:${siteSettings.email_address}`} className="flex items-center gap-2 text-[var(--text-light-primary)] hover:text-[var(--highlight)] transition-colors text-sm font-semibold">
                            <Mail className="h-3.5 w-3.5 text-[var(--highlight)] shrink-0" />
                            {siteSettings.email_address}
                        </a>
                    )}
                </div>
            </div>

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
                        <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            {bike.condition}
                        </span>
                        {bike.status === 'sold' && (
                            <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Sold
                            </span>
                        )}
                        {bike.status === 'reserved' && (
                            <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Reserved
                            </span>
                        )}
                        {bike.status === 'available_soon' && (
                            <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Coming Soon
                            </span>
                        )}
                    </div>
                    {bike.status === 'available_soon' && (
                        <p className="mt-3 text-sm text-[var(--text-dark-secondary)] max-w-lg">
                            This bike is currently being inspected by our mechanic. It's not quite ready for sale yet — if you're interested feel free to{' '}
                            <Link to="/contact" className="text-[var(--highlight)] underline hover:text-[var(--highlight)]">get in touch</Link> and we'll keep you in the loop.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <MediaGallery
                        videoId={videoId}
                        images={sortedImages}
                        selectedMedia={selectedMedia}
                        onSelect={setSelectedMedia}
                        altText={cardTitle}
                        overlay={statusOverlay}
                    />

                    {/* Right Column: Specifications & Description */}
                    <div>
                        <PriceDisplay
                            price={bike.price}
                            discount_price={bike.discount_price}
                            subtitle={bikeSubtitle}
                        />

                        {/* Reserve with Deposit — new bikes only */}
                        {siteSettings.accept_online_payment && (bike.condition === 'new' || bike.condition === 'demo') && bike.status === 'for_sale' && depositAmount && (
                            <div className="mb-6">
                                <button
                                    onClick={() => navigate(`/checkout/${bike.slug}`, { state: { checkoutType: 'deposit' } })}
                                    className="w-full py-3 px-6 rounded-lg text-lg font-bold uppercase tracking-widest transition-colors bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] border-2 border-[var(--text-dark-primary)]/20 hover:border-[var(--text-dark-primary)]/40 flex items-center justify-center gap-3"
                                >
                                    <img src={clickIcon} alt="" className="h-7 w-7 opacity-70" />
                                    Reserve with ${parseFloat(depositAmount).toLocaleString()} Deposit
                                </button>
                                <p className="text-xs text-[var(--text-dark-secondary)] mt-2 text-center">
                                    Secure your place with a ${parseFloat(depositAmount).toLocaleString()} deposit — we'll be in touch as soon as possible to arrange the rest.
                                </p>
                            </div>
                        )}
                        {bike.condition === 'new' && (bike.status === 'reserved' || bike.status === 'sold') && (
                            <div className="mb-6 p-4 bg-[var(--bg-light-secondary)] border border-border-light rounded-lg text-center">
                                <p className="text-sm font-semibold text-[var(--text-dark-secondary)]">
                                    {bike.status === 'reserved' ? 'This motorcycle is currently reserved.' : 'This motorcycle has been sold.'}
                                </p>
                                <Link to="/contact" className="text-sm text-[var(--highlight)] hover:underline mt-1 inline-block">
                                    Contact us about similar bikes
                                </Link>
                            </div>
                        )}

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

            {bike.condition === 'new' && <PayLaterSection />}

            {/* Featured bikes carousels */}
            <div>
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
