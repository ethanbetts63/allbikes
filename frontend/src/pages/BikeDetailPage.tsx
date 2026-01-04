import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBikeById, getBikes } from '@/api';
import type { Bike } from '@/types';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeaturedBikes from "@/components/FeaturedBikes";

const BikeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [newBikes, setNewBikes] = useState<Bike[]>([]);
    const [usedBikes, setUsedBikes] = useState<Bike[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchBike = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getBikeById(id);
                
                const sortedImages = [...data.images].sort((a, b) => a.order - b.order);
                data.images = sortedImages;
                
                setBike(data);

                if (data.images && data.images.length > 0) {
                    setSelectedImage(data.images[0].image);
                } else {
                    setSelectedImage('/src/assets/motorcycle_images/placeholder.png');
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
                const newBikesData = await getBikes('new', 1, true);
                setNewBikes(newBikesData.results);
                
                const usedBikesData = await getBikes('used', 1, true);
                const demoBikesData = await getBikes('demo', 1, true);
                setUsedBikes([...usedBikesData.results, ...demoBikesData.results]);
            } catch (error) {
                console.error("Failed to fetch featured bikes:", error);
            }
        };

        fetchBike();
        fetchFeaturedBikes();
    }, [id]);

    const sortedImages = React.useMemo(() => {
        if (!bike?.images) return [];
        return [...bike.images].sort((a, b) => a.order - b.order);
    }, [bike]);
    
    const specifications = bike ? [
        { label: "Price", value: bike.price, formatter: (val: string) => `$${parseInt(val).toLocaleString()}` },
        { label: "Stock Number", value: bike.stock_number },
        { label: "Odometer", value: bike.odometer, formatter: (val: number) => `${val.toLocaleString()} km` },
        { label: "Engine Size", value: bike.engine_size, formatter: (val: number) => `${val}cc` },
        { label: "Year", value: bike.year },
        { label: "Transmission", value: bike.transmission },
        { label: "Registration", value: bike.rego },
        { label: "Rego Expiry", value: bike.rego_exp },
        { label: "Warranty", value: bike.warranty_months, formatter: (val: number) => `${val} months` },
    ] : [];

    const pageTitle = bike ? `${bike.year || ''} ${bike.make} ${bike.model}`.trim() : 'Bike Details';

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error) {
        return <p className="text-red-500 text-center mt-8">{error}</p>;
    }

    if (!bike) {
        return <p className="text-center mt-8">Bike not found.</p>;
    }
    
    const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    return (
        <>
            <Seo title={`${pageTitle} | Allbikes`} />
            <div className="container mx-auto p-4 lg:p-8">
                <h1 className="text-3xl md:text-4xl font-bold text-center my-4">{cardTitle}</h1>
                <div className="text-center mb-8 flex justify-center gap-2">
                    <Badge className="text-lg capitalize">{bike.condition}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Image Gallery */}
                    <div>
                        <div className="aspect-video w-full overflow-hidden rounded-lg mb-4 border">
                            <img src={selectedImage} alt={cardTitle} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex space-x-2">
                            {sortedImages.length > 1 ? (
                                sortedImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(img.image)}
                                        className={`w-20 h-20 overflow-hidden rounded-md border-2 ${selectedImage === img.image ? 'border-blue-500' : 'border-transparent'}`}
                                    >
                                        <img src={img.image} alt={`${cardTitle} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))
                            ) : null}
                        </div>
                    </div>

                    {/* Right Column: Specifications & Description */}
                    <div>
                        <Card className="bg-white text-black mb-8">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">Specifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {specifications.map((spec) => {
                                        if (spec.value === null || spec.value === undefined || spec.value === '') return null;
                                        const displayValue = spec.formatter ? spec.formatter(spec.value as any) : spec.value;
                                        return (
                                            <li key={spec.label} className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="font-semibold text-gray-600">{spec.label}:</span>
                                                <span className="text-gray-900">{displayValue}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </Card>

                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Description</h2>
                        <div className="prose max-w-none">
                            <p>{bike.description || 'No description available.'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-16">
                {bike.condition.toLowerCase() === 'new' && newBikes.length > 0 && (
                    <FeaturedBikes
                        title="Featured New Bikes"
                        bikes={newBikes}
                        description="Check out our latest models, fresh from the factory."
                        linkTo="/inventory/new"
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
        </>
    );
};

export default BikeDetailPage;
