import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBikeById, getBikes } from '@/api';
import type { Bike } from '@/types';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from "@/components/ui/badge";
import FeaturedBikes from "@/components/FeaturedBikes";
import YouTube from 'react-youtube';
import {
    DollarSign,
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
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb';

interface Specification {
    label: string;
    value: string | number | null | undefined;
    icon: React.ElementType;
    formatter?: (val: any) => string;
}

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

const BikeDetailPage: React.FC = () => {
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

    const sortedImages = React.useMemo(() => {
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
                    "item": `https://www.allbikesvespawarehouse.com.au${item.href}`
                }))
            },
            {
                "@type": "Product",
                "name": pageTitle,
                "image": bike.images.length > 0 ? `https://www.allbikesvespawarehouse.com.au${bike.images[0].image}` : `https://www.allbikesvespawarehouse.com.au/src/assets/motorcycle_images/placeholder.png`,
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
                    "url": `https://www.allbikesvespawarehouse.com.au/inventory/motorcycles/${bike.slug}`
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
            <div className="flex justify-center items-center h-screen bg-[var(--text-primary)]">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error) {
        return <p className="text-red-500 text-center mt-8 bg-[var(--text-primary)] text-black">{error}</p>;
    }

    if (!bike) {
        return <p className="text-center mt-8 bg-[var(--text-primary)] text-black">Bike not found.</p>;
    }
    
    const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    return (
        <div className="bg-background text-black">
            <Seo
                title={`${pageTitle} | Allbikes`}
                description={bike.description || `Check out the ${pageTitle} at Allbikes Vespa Warehouse, Perth's most experienced motorcycle and scooter dealership.`}
                canonicalPath={`/inventory/motorcycles/${bike.slug}`}
                ogImage={ogImage}
                structuredData={structuredData}
            />
            <div className="container mx-auto">
                <Breadcrumb items={breadcrumbItems} />
            </div>
            <div className="container mx-auto p-4 lg:p-8 bg-[var(--text-primary)] rounded-lg mt-2">
                <h1 className="text-3xl md:text-4xl font-bold text-center my-4 text-black">{cardTitle}</h1>
                <div className="text-center mb-8 flex justify-center gap-2">
                    <Badge className="text-lg capitalize">{bike.condition}</Badge>
                    {bike.status === 'sold' && (
                        <Badge variant="destructive" className="text-lg">Sold</Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Image Gallery */}
                    <div>
                        <div className="aspect-video w-full overflow-hidden rounded-lg mb-4 border bg-black">
                            {selectedMedia === 'YOUTUBE' && videoId ? (
                                <YouTube videoId={videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                            ) : (
                                <img src={selectedMedia} alt={cardTitle} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex space-x-2">
                            {videoId && (
                                <button
                                    onClick={() => setSelectedMedia('YOUTUBE')}
                                    className={`relative w-20 h-20 overflow-hidden rounded-md border-2 ${selectedMedia === 'YOUTUBE' ? 'border-blue-500' : 'border-transparent'}`}
                                >
                                    <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt="YouTube video thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <PlayCircle className="h-8 w-8 text-white" />
                                    </div>
                                </button>
                            )}
                            {sortedImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedMedia(img.image)}
                                    className={`w-20 h-20 overflow-hidden rounded-md border-2 ${selectedMedia === img.image ? 'border-blue-500' : 'border-transparent'}`}
                                >
                                    <img src={img.image} alt={`${cardTitle} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Specifications & Description */}
                    <div>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold border-b pb-2 mb-4 text-black">Specifications</h2>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="h-6 w-6 text-black" />
                                    <span className="text-black">Price</span>
                                </div>
                                <div className="text-lg font-semibold">
                                    {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
                                        <div className="flex items-center space-x-2">
                                            <p className="text-destructive line-through">
                                                ${parseFloat(bike.price).toLocaleString()}
                                            </p>
                                            <p className="text-primary">
                                                ${parseFloat(bike.discount_price).toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-primary">
                                            ${parseFloat(bike.price).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {specifications.map((spec) => {
                                    if (spec.value === null || spec.value === undefined || spec.value === '') return null;
                                    const displayValue = spec.formatter ? spec.formatter(spec.value) : spec.value;
                                    return (
                                        <li key={spec.label} className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <TooltipProvider>
                                                <Tooltip>
                                                                                                <TooltipTrigger className="flex items-center space-x-2">
                                                                                                    <spec.icon className="h-6 w-6 text-black" />
                                                                                                    <span className="text-black">{spec.label}</span>
                                                                                                </TooltipTrigger>                                                    <TooltipContent>
                                                        <p>{spec.label}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <span className="text-black text-lg">{displayValue}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <h2 className="text-2xl font-bold border-b pb-2 mb-4 text-black">Description</h2>
                        <div className="prose max-w-none text-black">
                            <p className="text-black">{bike.description || 'No description available.'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 mb-4">
                {bike.condition.toLowerCase() === 'new' && newBikes.length > 0 && (
                    <FeaturedBikes
                        title={<>Featured <span className="hidden md:inline">New Motorcycles and Scooters</span><span className="md:hidden">New Bikes</span></>}
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
