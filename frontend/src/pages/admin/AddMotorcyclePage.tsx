import MotorcycleForm from "@/components/admin/inventory/MotorcycleForm";

const AddMotorcyclePage = () => {

    const handleFormSubmit = (data: any) => {
        console.log("Form submitted with data:", data);
        // Here we will eventually call the API to create/update the motorcycle
    };

    return (
        <div>
            <MotorcycleForm onSubmit={handleFormSubmit} />
        </div>
    );
};

export default AddMotorcyclePage;
