import React, { useState, useEffect } from 'react';
import { getBrands } from '@/api';
import type { Brand } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

const ServiceBrands: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                setIsLoading(true);
                const data = await getBrands();
                // Separate brands into serviceable and non-serviceable, then combine
                const serviceableBrands = data.filter(brand => brand.serviceable);
                const nonServiceableBrands = data.filter(brand => !brand.serviceable);
                setBrands([...serviceableBrands, ...nonServiceableBrands]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrands();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><Spinner /></div>;
    }

    if (error) {
        return <p className="text-red-500 text-center">{error}</p>;
    }

    return (
        <div className="p-8 bg-foreground text-[var(--text-primary)] rounded-lg">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {/* Left Column: Title and Text (2/3 width) */}
                    <div className="md:col-span-2 md:pr-8">
                        <h2 className="text-3xl font-bold mb-4">Brands We Work On</h2>
                        <p className="text-lg text-[var(--text-secondary)]">
                            We service almost all motorcycle brands, and most scooter brands. We do not service the excluded scooter brands due to ongoing concerns around build quality and/or the availability of reliable parts, which prevents us from guaranteeing the standard of work we stand by. Scooter brands not listed may be considered, however parts availability and long-term reliability are key factors.
                        </p>
                    </div>

                    {/* Right Column: Brands (1/3 width) */}
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        {brands.map((brand) => (
                            <Badge
                                key={brand.id}
                                className={cn(
                                    "text-lg text-[var(--text-primary)]",
                                    {
                                        "bg-green-600 hover:bg-green-700": brand.serviceable,
                                        "bg-red-600 hover:bg-red-700": !brand.serviceable,
                                    }
                                )}
                            >
                                {brand.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceBrands;
