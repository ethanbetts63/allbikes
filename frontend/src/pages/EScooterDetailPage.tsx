import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '@/api';
import type { Product } from '@/types/Product';
import Seo from '@/components/Seo';
import stripeLogo from '@/assets/stripe-ar21.svg';
import clickIcon from '@/assets/click.svg';
import { siteSettings } from '@/config/siteSettings';
import PayLaterSection from '@/components/PayLaterSection';
import FreeDeliveryBadge from '@/components/FreeDeliveryBadge';
import MediaGallery from '@/components/MediaGallery';
import PriceDisplay from '@/components/PriceDisplay';
import { LoadingScreen, ErrorScreen } from '@/components/DetailPageStates';
import { getYouTubeVideoId } from '@/utils/youtube';

const EScooterDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<string>('');

    const videoId = product?.youtube_link ? getYouTubeVideoId(product.youtube_link) : null;

    const productId = slug ? Number(slug.split('-').pop()) : null;

    useEffect(() => {
        if (!productId || isNaN(productId)) {
            setError('Product not found.');
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getProductById(productId);
                setProduct(data);
                const sorted = [...data.images].sort((a, b) => a.order - b.order);
                if (data.youtube_link && getYouTubeVideoId(data.youtube_link)) {
                    setSelectedMedia('YOUTUBE');
                } else if (sorted.length > 0) {
                    setSelectedMedia(sorted[0].image);
                }
            } catch {
                setError('Product not found.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const sortedImages = useMemo(() => {
        if (!product?.images) return [];
        return [...product.images].sort((a, b) => a.order - b.order);
    }, [product]);

    if (isLoading) return <LoadingScreen />;
    if (error || !product) return <ErrorScreen message={error || 'Product not found.'} />;

    const ogImage = selectedMedia === 'YOUTUBE' && videoId
        ? `https://img.youtube.com/vi/${videoId}/0.jpg`
        : (selectedMedia !== 'YOUTUBE' ? selectedMedia : undefined);

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.scootershop.com.au/" },
                    { "@type": "ListItem", "position": 2, "name": "Electric Scooters", "item": "https://www.scootershop.com.au/escooters" },
                    { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://www.scootershop.com.au/escooters/${product.slug}` }
                ]
            },
            {
                "@type": "Product",
                "name": product.name,
                "image": sortedImages[0]?.image,
                "description": product.description || `Buy the ${product.name} online. Price includes GST with free delivery Australia-wide.`,
                ...(product.brand && { "brand": { "@type": "Brand", "name": product.brand } }),
                "offers": {
                    "@type": "Offer",
                    "price": product.discount_price && parseFloat(product.discount_price) > 0 ? product.discount_price : product.price,
                    "priceCurrency": "AUD",
                    "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "url": `https://www.scootershop.com.au/escooters/${product.slug}`
                },
                ...(videoId && {
                    "video": {
                        "@type": "VideoObject",
                        "name": `${product.name} - Walkthrough`,
                        "description": product.description,
                        "thumbnailUrl": `https://img.youtube.com/vi/${videoId}/0.jpg`,
                        "embedUrl": `https://www.youtube.com/embed/${videoId}`,
                        "uploadDate": product.created_at
                    }
                })
            }
        ]
    };

    return (
        <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)]">
            <Seo
                title={`${product.name} | Scooter Shop`}
                description={product.description || `Buy the ${product.name} online. Price includes GST with free delivery Australia-wide.`}
                canonicalPath={`/escooters/${product.slug}`}
                ogImage={ogImage}
                structuredData={structuredData}
            />

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
                    <FreeDeliveryBadge className="shrink-0 md:mt-1 self-start" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <MediaGallery
                        videoId={videoId}
                        images={sortedImages}
                        selectedMedia={selectedMedia}
                        onSelect={setSelectedMedia}
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
                                <button
                                    disabled={!product.in_stock}
                                    onClick={() => navigate(`/checkout/${product.slug}`)}
                                    className="w-full py-3 px-6 rounded-lg text-lg font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] border-2 border-[var(--text-dark-primary)]/20 hover:border-[var(--text-dark-primary)]/40 flex items-center justify-center gap-3"
                                >
                                    <img src={clickIcon} alt="" className="h-7 w-7 opacity-70" />
                                    {product.in_stock ? 'Buy Now' : 'Out of Stock'}
                                </button>

                                <div className="text-sm text-[var(--text-dark-secondary)] space-y-1 pt-1">
                                    <p>✓ Order confirmation sent to your email</p>
                                    <p>✓ Free delivery Australia-wide</p>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                                    <span className="text-xs text-[var(--text-dark-secondary)]">Powered by</span>
                                    <img src={stripeLogo} alt="Stripe" className="h-6 w-auto opacity-70" />
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
                    to="/escooters"
                    className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
                >
                    ← Back to E-Scooters
                </Link>
            </div>
        </div>
    );
};

export default EScooterDetailPage;
