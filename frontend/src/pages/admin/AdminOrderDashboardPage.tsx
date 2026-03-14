import OrderTable from '@/components/OrderTable';

const AdminOrderDashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-light-primary)]">Orders</h1>
      <OrderTable />
    </div>
  );
};

export default AdminOrderDashboardPage;
