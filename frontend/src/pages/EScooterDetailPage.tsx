import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '@/api';
import type { Product } from '@/types/Product';
import type { ProductImage } from '@/types/ProductImage';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Truck } from 'lucide-react';
import stripeLogo from '@/assets/stripe-ar21.svg';

const EScooterDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

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
                if (sorted.length > 0) {
                    setSelectedImage(sorted[0]);
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
            <div className="flex justify-center items-center h-screen bg-white">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error || !product) {
        return <p className="text-destructive text-center mt-8">{error || 'Product not found.'}</p>;
    }

    const mainImageUrl = selectedImage?.medium || selectedImage?.image;

    return (
        <div className="bg-white text-[var(--text-dark-primary)]">
            <Seo
                title={`${product.name} | Scooter Shop`}
                description={product.description || `Buy the ${product.name} online. Price includes GST with free delivery Australia-wide.`}
                canonicalPath={`/escooters/${product.slug}`}
                ogImage={sortedImages[0]?.medium}
            />

            <div className="container mx-auto px-4 pb-12 lg:px-8">

                {/* Title + badges */}
                <div className="mb-6 pt-4">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-dark-primary)] leading-tight mb-3">
                        {product.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {product.brand && (
                            <span className="bg-stone-900/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                {product.brand}
                            </span>
                        )}
                        {!product.in_stock && (
                            <span className="bg-stone-900/80 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Out of Stock
                            </span>
                        )}
                        {product.low_stock && product.in_stock && (
                            <span className="bg-stone-900/80 text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Low Stock
                            </span>
                        )}
                        <span className="bg-stone-900/80 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Free Delivery
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Image Gallery */}
                    <div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-stone-100">
                            {mainImageUrl ? (
                                <img
                                    src={mainImageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-light-secondary)]">
                                    <span className="text-sm">No image available</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {sortedImages.length > 1 && (
                            <div className="flex gap-2 flex-wrap">
                                {sortedImages.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(img)}
                                        className={`w-20 h-20 overflow-hidden rounded-md ${selectedImage?.id === img.id ? 'ring-2 ring-amber-400' : 'ring-1 ring-stone-200'}`}
                                    >
                                        <img
                                            src={img.medium || img.image}
                                            alt={`${product.name} thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Price, Description, CTA */}
                    <div>
                        {/* Price */}
                        <div className="mb-6 pb-4 border-b border-stone-200">
                            {product.discount_price && parseFloat(product.discount_price) > 0 ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-semibold text-amber-400">
                                        ${parseFloat(product.discount_price).toLocaleString()}
                                    </span>
                                    <span className="text-xl text-stone-400 line-through">
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
                        <div className="space-y-3">
                            <button
                                disabled={!product.in_stock}
                                onClick={() => navigate(`/checkout/${product.slug}`)}
                                className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-400 hover:bg-amber-500 text-[var(--text-dark-primary)]"
                            >
                                {product.in_stock ? 'Buy Now' : 'Out of Stock'}
                            </button>

                            <div className="text-sm text-[var(--text-dark-secondary)] space-y-1 pt-1">
                                <p>✓ Order confirmation sent to your email</p>
                                <p>✓ Free delivery Australia-wide</p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                                <span className="text-xs text-stone-400">Powered by</span>
                                <img src={stripeLogo} alt="Stripe" className="h-6 w-auto opacity-70" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to E-Scooters */}
            <div className="container mx-auto px-4 lg:px-8 pb-12">
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
