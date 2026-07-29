import OrderTable from '@/app/dashboard/orders/_components/OrderTable';

export default function BikeOrdersPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-[var(--text-dark-primary)]">Bike Orders</h1>
      <OrderTable kind="bike" />
    </div>
  );
}
