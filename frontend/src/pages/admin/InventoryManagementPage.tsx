import InventoryTable from "@/components/InventoryTable";

const InventoryManagementPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Inventory Management</h1>
            <InventoryTable />
        </div>
    );
};

export default InventoryManagementPage;
