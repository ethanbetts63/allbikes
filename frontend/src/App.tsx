import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { siteSettings } from './config/siteSettings';
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
const ServiceBookingPage = lazy(() => import('./pages/ServiceBookingPage'));
const ServiceBookingConfirmationPage = lazy(() => import('./pages/ServiceBookingConfirmationPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));
const SecurityPolicyPage = lazy(() => import('./pages/SecurityPolicyPage')); 
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage')); 
const ContactPage = lazy(() => import('./pages/ContactPage'));
const EScooterListPage = lazy(() => import('./pages/EScooterListPage'));
const EScooterDetailPage = lazy(() => import('./pages/EScooterDetailPage'));
const ElectricScootersLandingPage = lazy(() => import('./pages/ElectricScootersLandingPage'));
const RefundsPage = lazy(() => import('./pages/RefundsPage'));
const AdminProductDashboardPage = lazy(() => import('./pages/admin/AdminProductDashboardPage'));
const AdminProductDetailPage = lazy(() => import('./pages/admin/AdminProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutPaymentPage = lazy(() => import('./pages/CheckoutPaymentPage'));
const CheckoutProcessingPage = lazy(() => import('./pages/CheckoutProcessingPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const CheckoutErrorPage = lazy(() => import('./pages/CheckoutErrorPage'));
const AdminOrderDashboardPage = lazy(() => import('./pages/admin/AdminOrderDashboardPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminSentMessagesPage = lazy(() => import('./pages/admin/AdminSentMessagesPage'));
const AdminSentMessageDetailPage = lazy(() => import('./pages/admin/AdminSentMessageDetailPage'));
const AdminServiceBookingsDashboardPage = lazy(() => import('./pages/admin/AdminServiceBookingsDashboardPage'));
const AdminServiceBookingDetailPage = lazy(() => import('./pages/admin/AdminServiceBookingDetailPage'));
const AdminHireDashboardPage = lazy(() => import('./pages/admin/AdminHireDashboardPage'));
const AdminHireDetailPage = lazy(() => import('./pages/admin/AdminHireDetailPage'));
const AdminHireSettingsPage = lazy(() => import('./pages/admin/AdminHireSettingsPage'));
const HireListPage = lazy(() => import('./pages/HireListPage'));
const HireLandingPage = lazy(() => import('./pages/HireLandingPage'));
const HireBookingPage = lazy(() => import('./pages/HireBookingPage'));
const HirePaymentPage = lazy(() => import('./pages/HirePaymentPage'));
const HireProcessingPage = lazy(() => import('./pages/HireProcessingPage'));
const HireConfirmationPage = lazy(() => import('./pages/HireConfirmationPage'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner className="h-12 w-12" />
  </div>
);

function App() {
  return (
    <HelmetProvider>
        <div className="min-h-screen flex flex-col">
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
                <Route path="/inventory/motorcycles/parts" element={<BikeListPage bikeCondition="parts" />} />
                <Route path="/inventory/motorcycles/:slug" element={<BikeDetailPage />} />
                <Route path="/service-booking" element={<ServiceBookingPage />} />
                <Route path="/service-booking/confirmation" element={<ServiceBookingConfirmationPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsAndConditionsPage />} />
                <Route path="/security" element={<SecurityPolicyPage />} /> 
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/electric-scooters" element={<ElectricScootersLandingPage />} />
                <Route path="/escooters" element={<EScooterListPage />} />
                <Route path="/escooters/:slug" element={<EScooterDetailPage />} />
                <Route element={siteSettings.show_hire ? <Outlet /> : <Navigate to="/" replace />}>
                  <Route path="/hire" element={<HireListPage />} />
                  <Route path="/motorcycle-hire" element={<HireLandingPage />} />
                  <Route path="/hire/confirmation/:bookingReference" element={<HireConfirmationPage />} />
                  <Route path="/hire/processing" element={<HireProcessingPage />} />
                  <Route path="/hire/book" element={<HireBookingPage />} />
                  <Route path="/hire/book/:bookingReference/payment" element={<HirePaymentPage />} />
                </Route>
                <Route path="/refunds" element={<RefundsPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/error" element={<CheckoutErrorPage />} />
                <Route path="/checkout/processing" element={<CheckoutProcessingPage />} />
                <Route path="/checkout/:slug" element={<CheckoutPage />} />
                <Route path="/checkout/:slug/payment" element={<CheckoutPaymentPage />} />

                {/* Dashboard Section */}
                <Route path="/dashboard" element={<AdminLayout />}>
                  <Route index element={<AdminHomePage />} />
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
                  <Route path="hire" element={<AdminHireDashboardPage />} />
                  <Route path="hire/:id" element={<AdminHireDetailPage />} />
                  <Route path="hire-settings" element={<AdminHireSettingsPage />} />
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