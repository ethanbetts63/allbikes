import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminGetDashboard } from '@/api';
import type { AdminDashboard } from '@/types/AdminDashboard';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle } from 'lucide-react';

const AdminHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminGetDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const allClear = dashboard &&
    dashboard.paid_orders.length === 0 &&
    dashboard.reserved_bikes.length === 0 &&
    dashboard.attention_products.length === 0;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-1 text-[var(--text-dark-primary)]">Dashboard</h1>
      <p className="text-[var(--text-dark-secondary)] text-sm mb-8">
        Welcome back, {user?.first_name || user?.email}.
      </p>

      {isLoading && (
        <div className="flex justify-center pt-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!isLoading && allClear && (
        <div className="flex flex-col items-center pt-12 text-center gap-3">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-[var(--text-dark-primary)] font-semibold">All clear</p>
          <p className="text-[var(--text-dark-secondary)] text-sm">No outstanding items.</p>
        </div>
      )}

      {!isLoading && dashboard && !allClear && (
        <div className="space-y-8">

          {/* Orders to action */}
          {dashboard.paid_orders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
                Orders to action — {dashboard.paid_orders.length}
              </h2>
              <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light text-xs text-[var(--text-dark-secondary)] uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">Reference</th>
                      <th className="text-left px-4 py-3 font-semibold">Customer</th>
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dashboard.paid_orders.map(order => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        className="hover:bg-[var(--bg-light-secondary)] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-[var(--text-dark-primary)]">
                            {order.order_reference}
                          </span>
                          {order.payment_type === 'deposit' && (
                            <span className="ml-2 text-xs bg-stone-200 text-[var(--text-dark-secondary)] px-1.5 py-0.5 rounded font-medium">
                              Deposit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-dark-secondary)]">{order.customer_name}</td>
                        <td className="px-4 py-3 text-[var(--text-dark-secondary)]">
                          {new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Reserved motorcycles */}
          {dashboard.reserved_bikes.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
                Reserved motorcycles — {dashboard.reserved_bikes.length}
              </h2>
              <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light divide-y divide-stone-100">
                {dashboard.reserved_bikes.map(bike => (
                  <Link
                    key={bike.id}
                    to="/dashboard/inventory"
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-light-secondary)] transition-colors"
                  >
                    <span className="text-sm text-[var(--text-dark-primary)] font-medium">
                      {bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`}
                    </span>
                    <span className="text-xs text-[var(--highlight)] font-bold uppercase tracking-widest">Reserved</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Attention products */}
          {dashboard.attention_products.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
                Product stock — {dashboard.attention_products.length}
              </h2>
              <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light divide-y divide-stone-100">
                {dashboard.attention_products.map(product => (
                  <Link
                    key={product.id}
                    to="/dashboard/products"
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-light-secondary)] transition-colors"
                  >
                    <span className="text-sm text-[var(--text-dark-primary)] font-medium">{product.name}</span>
                    {!product.in_stock ? (
                      <span className="text-xs text-destructive font-bold uppercase tracking-widest">Out of Stock</span>
                    ) : (
                      <span className="text-xs text-[var(--highlight)] font-bold uppercase tracking-widest">
                        Low Stock — {product.stock_quantity} left
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminHomePage;
