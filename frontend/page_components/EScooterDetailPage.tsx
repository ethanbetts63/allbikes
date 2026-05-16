import Link from 'next/link';
import type { Product } from '@/types/Product';
import StructuredDataScript from '@/components/StructuredDataScript';
import stripeLogo from '@/assets/stripe-ar21.svg';
import clickIcon from '@/assets/click.svg';
import { siteSettings } from '@/config/siteSettings';
import PayLaterSection from '@/components/PayLaterSection';
import FreeDeliveryBadge from '@/components/FreeDeliveryBadge';
import PopularBadge from '@/components/PopularBadge';
import MediaGallery from '@/components/MediaGallery';
import PriceDisplay from '@/components/PriceDisplay';
import { ErrorScreen } from '@/components/DetailPageStates';
import { getYouTubeVideoId } from '@/utils/youtube';
import { ShieldCheck } from 'lucide-react';
import { assetUrl } from '@/utils/assetUrl';
import { getPrimaryVehicleImage, getSortedVehicleImages } from '@/utils/vehicleImages';

interface EScooterDetailPageProps {
    initialProduct?: Product | null;
}

const EScooterDetailPage = ({ initialProduct }: EScooterDetailPageProps) => {
    const product = initialProduct ?? null;

    const videoId = product?.youtube_link ? getYouTubeVideoId(product.youtube_link) : null;
    const sortedImages = getSortedVehicleImages(product?.images);

    if (!product) return <ErrorScreen message="Product not found." />;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.scootershop.com.au/" },
            { "@type": "ListItem", "position": 2, "name": "Electric Scooters", "item": "https://www.scootershop.com.au/escooters" },
            { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://www.scootershop.com.au/escooters/${product.slug}` }
        ]
    };

    return (
        <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)]">
            <StructuredDataScript structuredData={structuredData} />

            <div className="container mx-auto px-4 pb-12 lg:px-8">

                {/* Title + badges */}
                <div className="mb-6 pt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[var(--text-dark-primary)] leading-tight mb-3">
                            {product.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            {product.brand && (
                                <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    {product.brand}
                                </span>
                            )}
                            {!product.in_stock && (
                                <span className="bg-[var(--bg-dark-primary)]/80 text-destructive text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    Out of Stock
                                </span>
                            )}
                            {product.low_stock && product.in_stock && (
                                <span className="bg-[var(--bg-dark-primary)]/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    Low Stock
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start">
                        {product.popular && <PopularBadge className="shrink-0 md:mt-1" />}
                        <FreeDeliveryBadge className="shrink-0 md:mt-1" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <MediaGallery
                        videoId={videoId}
                        images={sortedImages}
                        initialSelectedMedia={getInitialSelectedMedia(product)}
                        altText={product.name}
                    />

                    {/* Right Column: Price, Description, CTA */}
                    <div>
                        <PriceDisplay
                            price={product.price}
                            discount_price={product.discount_price}
                            subtitle={<p className="text-sm text-[var(--text-dark-secondary)]">Price includes GST · Free delivery Australia-wide</p>}
                        />

                        {/* Description */}
                        {product.description && (
                            <div className="mb-8">
                                <h2 className="text-lg font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-3">Description</h2>
                                <p className="text-[var(--text-dark-secondary)] leading-relaxed text-sm whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* CTA */}
                        {siteSettings.accept_online_payment && (
                            <div className="space-y-3">
                                {product.in_stock ? (
                                    <Link
                                        href={`/checkout/${product.slug}`}
                                        className="w-full py-3 px-6 font-bold text-sm uppercase tracking-wide transition-colors bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] flex items-center justify-center gap-3"
                                    >
                                        <img src={assetUrl(clickIcon)} alt="" className="h-7 w-7 opacity-70" />
                                        Buy Now
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-3 px-6 font-bold text-sm uppercase tracking-wide transition-colors opacity-50 cursor-not-allowed bg-highlight text-[var(--text-dark-primary)] flex items-center justify-center gap-3"
                                    >
                                        <img src={assetUrl(clickIcon)} alt="" className="h-7 w-7 opacity-70" />
                                        Out of Stock
                                    </button>
                                )}

                                <div className="text-sm text-[var(--text-dark-secondary)] space-y-1 pt-1">
                                    <p>✓ Order confirmation sent to your email</p>
                                    <p>✓ Free delivery Australia-wide</p>
                                    <p className="flex items-center gap-1.5">
                                        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--highlight1)]" />
                                        12 months manufacturer warranty
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                                    <span className="text-xs text-[var(--text-dark-secondary)]">Powered by</span>
                                    <img src={assetUrl(stripeLogo)} alt="Stripe" className="h-6 w-auto opacity-70" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PayLaterSection />

            {/* Back to E-Scooters */}
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <Link
                    href="/escooters"
                    className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
                >
                    ← Back to E-Scooters
                </Link>
            </div>
        </div>
    );
};

function getInitialSelectedMedia(product?: Product | null): string {
    if (!product) return '';
    const primaryImage = getPrimaryVehicleImage(product.images, 'detail');
    if (primaryImage) return primaryImage;
    if (product.youtube_link && getYouTubeVideoId(product.youtube_link)) return 'YOUTUBE';
    return '';
}

export default EScooterDetailPage;
