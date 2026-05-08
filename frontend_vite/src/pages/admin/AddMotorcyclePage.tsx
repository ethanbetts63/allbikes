import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MotorcycleForm from "@/forms/MotorcycleForm";
import type { MotorcycleFormData } from "@/types/MotorcycleFormData";
import { 
    createMotorcycle, 
    uploadMotorcycleImage, 
    getBikeById, 
    updateMotorcycle,
    manageMotorcycleImages
} from "@/api";
import type { Bike } from '@/types/Bike';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AddMotorcyclePage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [initialData, setInitialData] = useState<Bike | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (id) {
            const fetchBike = async () => {
                setIsLoading(true);
                try {
                    const bike = await getBikeById(id);
                    setInitialData(bike);
                } catch (err) {
                    setNotification({ message: "Failed to fetch motorcycle data.", type: 'error' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBike();
        }
    }, [id]);

    const handleFormSubmit = async (data: MotorcycleFormData) => {
        setIsLoading(true);
        setNotification(null);

        try {
            const { managedImages, ...motorcycleData } = data;
            let savedMotorcycle;

            if (id) {
                // Update existing motorcycle
                savedMotorcycle = await updateMotorcycle(Number(id), motorcycleData);
                setNotification({
                    message: `Motorcycle Updated: ${savedMotorcycle.year} ${savedMotorcycle.make} ${savedMotorcycle.model} has been updated.`,
                    type: 'success'
                });
            } else {
                // Create new motorcycle
                savedMotorcycle = await createMotorcycle(motorcycleData);
                setNotification({
                    message: `Motorcycle Created: ${savedMotorcycle.year} ${savedMotorcycle.make} ${savedMotorcycle.model} has been saved.`,
                    type: 'success'
                });
            }

            // --- New Image Management Logic ---
            const hasImageChanges = managedImages && managedImages.length > 0;

            if (hasImageChanges) {
                setNotification({
                    message: "Processing Images... Updating image order and uploading new images. Please wait.",
                    type: 'info'
                });

                await manageMotorcycleImages(savedMotorcycle.id, managedImages);

                const newImages = managedImages.filter(img => img.file !== null);
                const uploadErrors: string[] = [];

                for (let i = 0; i < newImages.length; i++) {
                    const img = newImages[i];
                    setNotification({
                        message: `Uploading image ${i + 1} of ${newImages.length}...`,
                        type: 'info'
                    });
                    try {
                        await uploadMotorcycleImage(savedMotorcycle.id, img.file!, img.order);
                    } catch (err: any) {
                        uploadErrors.push(img.file!.name);
                    }
                }

                if (uploadErrors.length > 0) {
                    setNotification({
                        message: `Saved, but ${uploadErrors.length} image(s) failed to upload: ${uploadErrors.join(', ')}`,
                        type: 'error'
                    });
                    return; // Stay on page so the error is visible
                } else {
                    setNotification({ message: "Image Processing Complete: All image changes have been saved.", type: 'success' });
                }
            } else if (id) {
                // If we are editing and there are no images left, we must tell the backend to delete all of them.
                await manageMotorcycleImages(savedMotorcycle.id, []);
                setNotification({ message: "All images removed", type: 'success' });
            }

            navigate('/dashboard/inventory');

        } catch (err: any) {
            let errorMessage: string;
            if (err.data?.detail) {
                errorMessage = err.data.detail;
            } else if (err.data && typeof err.data === 'object') {
                errorMessage = Object.entries(err.data)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join(' | ');
            } else {
                errorMessage = err.message || "An unknown error occurred.";
            }
            const action = id ? 'update' : 'create';
            setNotification({ message: `Failed to ${action} motorcycle: ${errorMessage}`, type: 'error' });
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
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] mb-4">{id ? 'Edit Motorcycle' : 'Add Motorcycle'}</h1>
            {notification && (
                <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                    <AlertDescription>{notification.message}</AlertDescription>
                </Alert>
            )}
            <MotorcycleForm
                initialData={initialData}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
            />
        </div>
    );

};

export default AddMotorcyclePage;
