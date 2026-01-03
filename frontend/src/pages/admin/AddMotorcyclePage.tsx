import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "sonner"
import MotorcycleForm from "@/components/admin/inventory/MotorcycleForm";
import type { MotorcycleFormData } from "@/components/admin/inventory/MotorcycleForm";
import { createMotorcycle, uploadMotorcycleImage, getBikeById, updateMotorcycle } from "@/api";
import type { Bike } from '@/types';

const AddMotorcyclePage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [initialData, setInitialData] = React.useState<Bike | undefined>(undefined);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (id) {
            const fetchBike = async () => {
                setIsLoading(true);
                try {
                    const bike = await getBikeById(id);
                    setInitialData(bike);
                } catch (err) {
                    setError("Failed to fetch motorcycle data.");
                    toast.error("Error", { description: "Failed to fetch motorcycle data." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBike();
        }
    }, [id]);

    const handleFormSubmit = async (data: MotorcycleFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { images, ...motorcycleData } = data;
            let savedMotorcycle;

            if (id) {
                // Update existing motorcycle
                savedMotorcycle = await updateMotorcycle(Number(id), motorcycleData);
                toast.success("Motorcycle Updated", {
                    description: `${savedMotorcycle.year} ${savedMotorcycle.make} ${savedMotorcycle.model} has been updated.`,
                });
            } else {
                // Create new motorcycle
                savedMotorcycle = await createMotorcycle(motorcycleData);
                toast.success("Motorcycle Created", {
                    description: `${savedMotorcycle.year} ${savedMotorcycle.make} ${savedMotorcycle.model} has been saved.`,
                });
            }

            // Image upload logic (for both create and update)
            if (images && images.length > 0) {
                toast.info("Uploading Images...", {
                    description: `Uploading ${images.length} images. Please wait.`,
                });
                const uploadPromises = Array.from(images).map(imageFile =>
                    uploadMotorcycleImage(savedMotorcycle.id, imageFile)
                );
                await Promise.allSettled(uploadPromises);
                toast.success("Image Upload Complete", {
                    description: "All images have been processed.",
                });
            }

            navigate('/admin/inventory');

        } catch (err: any) {
            const errorMessage = err.data?.detail || err.message || "An unknown error occurred.";
            const action = id ? 'update' : 'create';
            setError(`Failed to ${action} motorcycle: ${errorMessage}`);
            toast.error("Error", {
                description: `Failed to ${action} motorcycle: ${errorMessage}`,
            });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Show a loading indicator while fetching initial data for editing
    if (id && isLoading && !initialData) {
        return <div>Loading...</div>;
    }
    
    return (
        <div>
            {error && <div className="mb-4 text-red-500 text-center bg-red-100 p-4 rounded-md">{error}</div>}
            <MotorcycleForm
                initialData={initialData}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AddMotorcyclePage;