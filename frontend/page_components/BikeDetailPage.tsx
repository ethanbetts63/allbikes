import Link from 'next/link';
import type { Bike } from '@/types/Bike';
import type { Specification } from '@/types/Specification';
import StructuredDataScript from '@/components/StructuredDataScript';
import DesktopOnly from '@/components/DesktopOnly';
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
import clickIcon from '@/assets/click.svg';
import type { BreadcrumbItem } from '@/types/BreadcrumbItem';
import { siteSettings } from '@/config/siteSettings';
import PayLaterSection from '@/components/PayLaterSection';
import MediaGallery from '@/components/MediaGallery';
import PriceDisplay from '@/components/PriceDisplay';
import { ErrorScreen } from '@/components/DetailPageStates';
import { getYouTubeVideoId } from '@/utils/youtube';
import PopularBadge from '@/components/PopularBadge';
import { assetUrl } from '@/utils/assetUrl';

interface BikeDetailPageProps {
    initialBike?: Bike | null;
    initialNewBikes?: Bike[];
    initialUsedBikes?: Bike[];
    depositAmount?: string | null;
}

const BikeDetailPage = ({
    initialBike,
    initialNewBikes = [],
    initialUsedBikes = [],
    depositAmount = null,
}: BikeDetailPageProps) => {
    const bike = initialBike ?? null;
    const videoId = bike?.youtube_link ? getYouTubeVideoId(bike.youtube_link) : null;
    const sortedImages = bike?.images ? [...bike.images].sort((a, b) => a.order - b.order) : [];

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

    const breadcrumbItems: BreadcrumbItem[] = bike ? [
        { name: 'Home', href: '/' },
        { name: bike.condition === 'new' ? 'New Bikes' : 'Used Bikes', href: bike.condition === 'new' ? '/inventory/motorcycles/new' : '/inventory/motorcycles/used' },
        { name: pageTitle, href: `/inventory/motorcycles/${bike.slug}` }
    ] : [];

    const structuredData = bike ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": `https://www.scootershop.com.au${item.href}`
        }))
    } : undefined;

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

            <StructuredDataScript structuredData={structuredData} />

            <div className="container mx-auto px-4 pb-12 lg:px-8">

                {/* Title + badges */}
                <div className="mb-6 pt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                    <div>
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
                        {bike.is_lams_approved && (
                            <span className="bg-green-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                LAMS Approved
                            </span>
                        )}
                    </div>
                    {bike.status === 'available_soon' && (
                        <p className="mt-3 text-sm text-[var(--text-dark-secondary)] max-w-lg">
                            {bike.condition === 'new'
                                ? <>This bike is still on its way — feel free to <Link href="/contact" className="text-[var(--highlight)] underline hover:text-[var(--highlight)]">reach out</Link> if you're interested.</>
                                : <>This bike is currently being inspected by our mechanic. It's not quite ready for sale yet — if you're interested feel free to <Link href="/contact" className="text-[var(--highlight)] underline hover:text-[var(--highlight)]">get in touch</Link> and we'll keep you in the loop.</>
                            }
                        </p>
                    )}
                    </div>
                    {bike.popular && <PopularBadge className="shrink-0 md:mt-1 self-start" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <MediaGallery
                        videoId={videoId}
                        images={sortedImages}
                        initialSelectedMedia={getInitialSelectedMedia(bike)}
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

                        {/* Reserve with Deposit */}
                        {siteSettings.accept_online_payment && (bike.condition === 'new' || bike.condition === 'demo' || bike.condition === 'used') && bike.status === 'for_sale' && depositAmount && (
                            <div className="mb-6">
                                <Link
                                    href={`/checkout/${bike.slug}?type=deposit`}
                                    className="w-full py-3 px-6 font-bold text-sm uppercase tracking-wide transition-colors bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] flex items-center justify-center gap-3"
                                >
                                    <img src={assetUrl(clickIcon)} alt="" className="h-7 w-7 opacity-70" />
                                    Buy Now - Deposit ${parseFloat(depositAmount).toLocaleString()} 
                                </Link>
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
                                <Link href="/contact" className="text-sm text-[var(--highlight)] hover:underline mt-1 inline-block">
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
                                            <span className="flex items-center gap-2 text-[var(--text-dark-secondary)]">
                                                <spec.icon className="h-4 w-4" />
                                                <span className="text-sm">{spec.label}</span>
                                            </span>
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
            <DesktopOnly>
                <div>
                    {bike.condition.toLowerCase() === 'new' && initialNewBikes.length > 0 && (
                        <FeaturedBikes
                            title={<>Featured <span className="hidden md:inline">New Motorcycles & Scooters</span><span className="md:hidden">New Bikes</span></>}
                            bikes={initialNewBikes}
                            description="Check out our latest models, fresh from the factory."
                            linkTo="/inventory/motorcycles/new"
                            linkText="View All New"
                        />
                    )}
                    {(bike.condition.toLowerCase() === 'used' || bike.condition.toLowerCase() === 'demo') && initialUsedBikes.length > 0 && (
                        <FeaturedBikes
                            title="Featured Used & Demo Bikes"
                            bikes={initialUsedBikes}
                            description="Great value pre-owned and demonstrator bikes."
                            linkTo="/inventory/motorcycles/used"
                            linkText="View All Used"
                        />
                    )}
                </div>
            </DesktopOnly>
        </div>
    );
};

function getInitialSelectedMedia(bike?: Bike | null): string {
    if (!bike) return 'YOUTUBE';
    const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
    const primaryImage = sortedImages[0]?.medium || sortedImages[0]?.image;
    if (primaryImage) return primaryImage;
    if (bike.youtube_link && getYouTubeVideoId(bike.youtube_link)) return 'YOUTUBE';
    return '/src/assets/motorcycle_images/placeholder.png';
}

export default BikeDetailPage;
