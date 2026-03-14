import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { Spinner } from './components/ui/spinner';

// --- Lazy-loaded Pages ---
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'));
const InventoryManagementPage = lazy(() => import('./pages/admin/InventoryManagementPage'));
const AddMotorcyclePage = lazy(() => import('./pages/admin/AddMotorcyclePage'));
const ServiceSettingsPage = lazy(() => import('./pages/admin/ServiceSettingsPage'));
const JobTypesPage = lazy(() => import('./pages/admin/JobTypesPage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const TyreFittingPage = lazy(() => import('./pages/TyreFittingPage'));
const BikeListPage = lazy(() => import('./pages/BikeListPage'));
const BikeDetailPage = lazy(() => import('./pages/BikeDetailPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const SecurityPolicyPage = lazy(() => import('./pages/SecurityPolicyPage')); 
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage')); 
const ContactPage = lazy(() => import('./pages/ContactPage'));
const EScooterListPage = lazy(() => import('./pages/EScooterListPage'));
const EScooterDetailPage = lazy(() => import('./pages/EScooterDetailPage'));
const RefundsPage = lazy(() => import('./pages/RefundsPage'));
const AdminProductDashboardPage = lazy(() => import('./pages/admin/AdminProductDashboardPage'));
const AdminProductDetailPage = lazy(() => import('./pages/admin/AdminProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutPaymentPage = lazy(() => import('./pages/CheckoutPaymentPage'));
const CheckoutProcessingPage = lazy(() => import('./pages/CheckoutProcessingPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const AdminOrderDashboardPage = lazy(() => import('./pages/admin/AdminOrderDashboardPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminSentMessagesPage = lazy(() => import('./pages/admin/AdminSentMessagesPage'));
const AdminSentMessageDetailPage = lazy(() => import('./pages/admin/AdminSentMessageDetailPage'));
const AdminServiceBookingsDashboardPage = lazy(() => import('./pages/admin/AdminServiceBookingsDashboardPage'));
const AdminServiceBookingDetailPage = lazy(() => import('./pages/admin/AdminServiceBookingDetailPage'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner className="h-12 w-12" />
  </div>
);

import BannerV2 from './components/BannerV2';

function App() {
  return (
    <HelmetProvider>
        <div className="min-h-screen flex flex-col">
          <BannerV2 />
          <NavBar />
          <main className="flex-grow">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/service" element={<ServicePage />} />
                <Route path="/tyre-fitting" element={<TyreFittingPage />} />
                <Route path="/inventory/motorcycles/new" element={<BikeListPage bikeCondition="new,demo" />} />
                <Route path="/inventory/motorcycles/used" element={<BikeListPage bikeCondition="used" />} />
                <Route path="/inventory/motorcycles/:slug" element={<BikeDetailPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/booking/success" element={<BookingSuccessPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsAndConditionsPage />} />
                <Route path="/security" element={<SecurityPolicyPage />} /> 
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/escooters" element={<EScooterListPage />} />
                <Route path="/escooters/:slug" element={<EScooterDetailPage />} />
                <Route path="/refunds" element={<RefundsPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/processing" element={<CheckoutProcessingPage />} />
                <Route path="/checkout/:productSlug" element={<CheckoutPage />} />
                <Route path="/checkout/:productSlug/payment" element={<CheckoutPaymentPage />} />

                {/* Dashboard Section */}
                <Route path="/dashboard" element={<AdminLayout />}>
                  <Route path="home" element={<AdminHomePage />} />
                  <Route path="inventory" element={<InventoryManagementPage />} />
                  <Route path="add-motorcycle" element={<AddMotorcyclePage />} />
                  <Route path="edit-motorcycle/:id" element={<AddMotorcyclePage />} />
                  <Route path="service-settings" element={<ServiceSettingsPage />} />
                  <Route path="job-types" element={<JobTypesPage />} />
                  <Route path="products" element={<AdminProductDashboardPage />} />
                  <Route path="products/new" element={<AdminProductDetailPage />} />
                  <Route path="products/:id/edit" element={<AdminProductDetailPage />} />
                  <Route path="orders" element={<AdminOrderDashboardPage />} />
                  <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                  <Route path="messages" element={<AdminSentMessagesPage />} />
                  <Route path="messages/:id" element={<AdminSentMessageDetailPage />} />
                  <Route path="service-bookings" element={<AdminServiceBookingsDashboardPage />} />
                  <Route path="service-bookings/:id" element={<AdminServiceBookingDetailPage />} />
                </Route>

              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
    </HelmetProvider>
  );
}

export default App;