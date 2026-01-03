// src/pages/admin/AddMotorcyclePage.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner"
import MotorcycleForm from "@/components/admin/inventory/MotorcycleForm";
import type { MotorcycleFormData } from "@/components/admin/inventory/MotorcycleForm";
import { createMotorcycle, uploadMotorcycleImage } from "@/api";

const AddMotorcyclePage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleFormSubmit = async (data: MotorcycleFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Phase 1: Create the motorcycle with its data (excluding images)
            const { images, ...motorcycleData } = data;
            const newMotorcycle = await createMotorcycle(motorcycleData);
            
            toast.success("Motorcycle Created", {
                description: `${newMotorcycle.year} ${newMotorcycle.make} ${newMotorcycle.model} has been saved.`,
            });

            // Phase 2: Upload images if any were selected
            if (images && images.length > 0) {
                 toast.info("Uploading Images...", {
                    description: `Uploading ${images.length} images. Please wait.`,
                });

                const uploadPromises = Array.from(images).map(imageFile => 
                    uploadMotorcycleImage(newMotorcycle.id, imageFile)
                );
                
                // We can use Promise.allSettled to see which images succeeded or failed
                await Promise.allSettled(uploadPromises);

                 toast.success("Image Upload Complete", {
                    description: "All images have been processed.",
                });
            }

            // Redirect to the admin inventory page on success
            navigate('/admin/inventory');

        } catch (err: any) {
            const errorMessage = err.data?.detail || err.message || "An unknown error occurred.";
            setError(`Failed to create motorcycle: ${errorMessage}`);
            toast.error("Error", {
                description: `Failed to create motorcycle: ${errorMessage}`,
            });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {error && <div className="mb-4 text-red-500 text-center bg-red-100 p-4 rounded-md">{error}</div>}
            <MotorcycleForm 
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AddMotorcyclePage;