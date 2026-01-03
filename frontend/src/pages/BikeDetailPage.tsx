import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBikeById } from '@/api';
import type { Bike } from '@/types';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from "@/components/ui/badge";

const BikeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');

    useEffect(() => {
        if (!id) return;

        const fetchBike = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getBikeById(id);
                
                // Sort images by order before setting state
                const sortedImages = [...data.images].sort((a, b) => a.order - b.order);
                data.images = sortedImages; //
                
                setBike(data);

                // Set the initial selected image from the sorted list
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

        fetchBike();
    }, [id]);

    // Memoize the sorted image list for rendering
    const sortedImages = React.useMemo(() => {
        if (!bike?.images) return [];
        // The list is already sorted in useEffect, but this ensures it
        return [...bike.images].sort((a, b) => a.order - b.order);
    }, [bike]);

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
    
    // Helper to render a specification row if the value exists
    const renderSpec = (label: string, value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === '') return null;
        return (
            <li className="flex justify-between py-2 border-b">
                <span className="font-semibold text-gray-600">{label}:</span>
                <span className="text-gray-800">{value}</span>
            </li>
        );
    };

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
                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Specifications</h2>
                        <ul className="space-y-2 mb-8">
                            {renderSpec("Price", `$${bike.price.toLocaleString()}`)}
                            {renderSpec("Stock Number", bike.stock_number)}
                            {renderSpec("Odometer", `${bike.odometer.toLocaleString()} km`)}
                            {renderSpec("Engine Size", `${bike.engine_size}cc`)}
                            {renderSpec("Year", bike.year)}
                            {renderSpec("Registration", bike.rego)}
                            {renderSpec("Rego Expiry", bike.rego_exp)}
                            {renderSpec("Warranty", bike.warranty_months ? `${bike.warranty_months} months` : null)}
                        </ul>

                        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Description</h2>
                        <div className="prose max-w-none">
                            <p>{bike.description || 'No description available.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BikeDetailPage;
