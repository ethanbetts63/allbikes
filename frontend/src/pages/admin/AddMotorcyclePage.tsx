import * as React from 'react';
import MotorcycleForm from "@/components/admin/inventory/MotorcycleForm";
import type { MotorcycleFormData } from "@/components/admin/inventory/MotorcycleForm";
import { getConditions } from "@/api";
import type { Condition } from "@/api";
import { Spinner } from '@/components/ui/spinner';

const AddMotorcyclePage = () => {
    const [conditions, setConditions] = React.useState<Condition[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchConditions = async () => {
            try {
                const conditionsData = await getConditions();
                setConditions(conditionsData);
            } catch (err) {
                setError("Failed to load form data. Please try again later.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConditions();
    }, []);

    const handleFormSubmit = (data: MotorcycleFormData) => {
        console.log("Form submitted with data:", data);
        // Here we will eventually call the API to create/update the motorcycle
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div>
            <MotorcycleForm 
                onSubmit={handleFormSubmit}
                conditions={conditions}
            />
        </div>
    );
};

export default AddMotorcyclePage;
