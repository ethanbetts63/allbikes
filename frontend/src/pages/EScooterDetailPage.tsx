import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '@/api';
import type { Product } from '@/types/Product';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { PlayCircle } from 'lucide-react';
import stripeLogo from '@/assets/stripe-ar21.svg';
import { siteSettings } from '@/config/siteSettings';
import PayLaterSection from '@/components/PayLaterSection';
import FreeDeliveryBadge from '@/components/FreeDeliveryBadge';
import YouTube from 'react-youtube';

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error || !product) {
        return <p className="text-destructive text-center mt-8">{error || 'Product not found.'}</p>;
    }

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
                    <div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-[var(--bg-light-secondary)]">
                            {selectedMedia === 'YOUTUBE' && videoId ? (
                                <YouTube videoId={videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                            ) : selectedMedia ? (
                                <img src={selectedMedia} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-light-secondary)]">
                                    <span className="text-sm">No image available</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        <div className="flex gap-2 flex-wrap">
                            {videoId && (
                                <button
                                    onClick={() => setSelectedMedia('YOUTUBE')}
                                    className={`relative w-20 h-20 overflow-hidden rounded-md ${selectedMedia === 'YOUTUBE' ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
                                >
                                    <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt="YouTube video thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <PlayCircle className="h-8 w-8 text-[var(--text-light-primary)]" />
                                    </div>
                                </button>
                            )}
                            {sortedImages.map((img, index) => (
                                <button
                                    key={img.id}
                                    onClick={() => setSelectedMedia(img.image)}
                                    className={`w-20 h-20 overflow-hidden rounded-md ${selectedMedia === img.image ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
                                >
                                    <img
                                        src={img.medium || img.image}
                                        alt={`${product.name} thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Price, Description, CTA */}
                    <div>
                        {/* Price */}
                        <div className="mb-6 pb-4 border-b border-border-light">
                            {product.discount_price && parseFloat(product.discount_price) > 0 ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-semibold text-[var(--highlight)]">
                                        ${parseFloat(product.discount_price).toLocaleString()}
                                    </span>
                                    <span className="text-xl text-[var(--text-dark-secondary)] line-through">
                                        ${parseFloat(product.price).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-4xl font-semibold text-[var(--text-dark-primary)]">
                                    ${parseFloat(product.price).toLocaleString()}
                                </span>
                            )}
                            <p className="text-sm text-[var(--text-dark-secondary)] mt-1">Price includes GST · Free delivery Australia-wide</p>
                        </div>

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
                                    className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
                                >
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
