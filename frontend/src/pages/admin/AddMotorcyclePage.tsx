import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MotorcycleForm from "@/forms/MotorcycleForm";
import type { MotorcycleFormData } from "@/types";
import { 
    createMotorcycle, 
    uploadMotorcycleImage, 
    getBikeById, 
    updateMotorcycle,
    manageMotorcycleImages
} from "@/api";
import type { Bike } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AddMotorcyclePage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [initialData, setInitialData] = React.useState<Bike | undefined>(undefined);
    const [notification, setNotification] = React.useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    React.useEffect(() => {
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
                
                const uploadPromises = managedImages
                    .filter(img => img.file !== null) // Filter for new uploads
                    .map(img => uploadMotorcycleImage(savedMotorcycle.id, img.file!, img.order));

                const managementPromise = manageMotorcycleImages(savedMotorcycle.id, managedImages);
                
                await Promise.allSettled([managementPromise, ...uploadPromises]);

                setNotification({ message: "Image Processing Complete: All image changes have been saved.", type: 'success' });
            } else if (id) {
                // If we are editing and there are no images left, we must tell the backend to delete all of them.
                await manageMotorcycleImages(savedMotorcycle.id, []);
                setNotification({ message: "All images removed", type: 'success' });
            }

            navigate('/admin/inventory');

        } catch (err: any) {
            const errorMessage = err.data?.detail || err.message || "An unknown error occurred.";
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
        <div>
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
