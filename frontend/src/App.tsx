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
const SecurityPolicyPage = lazy(() => import('./pages/SecurityPolicyPage')); // New lazy-loaded page
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage')); // New lazy-loaded page
const ContactPage = lazy(() => import('./pages/ContactPage'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner className="h-12 w-12" />
  </div>
);

import Banner from './components/Banner';

function App() {
  return (
    <HelmetProvider>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <Banner />
          <main className="flex-grow">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/service" element={<ServicePage />} />
                <Route path="/tyre-fitting" element={<TyreFittingPage />} />
                <Route path="/inventory/motorcycles/new" element={<BikeListPage bikeCondition="new" />} />
                <Route path="/inventory/motorcycles/used" element={<BikeListPage bikeCondition="used" />} />
                <Route path="/inventory/motorcycles/:slug" element={<BikeDetailPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/booking/success" element={<BookingSuccessPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsAndConditionsPage />} />
                <Route path="/security" element={<SecurityPolicyPage />} /> {/* New route */}
                <Route path="/privacy" element={<PrivacyPolicyPage />} /> {/* New route */}

                {/* Admin Section */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminHomePage />} />
                  <Route path="inventory" element={<InventoryManagementPage />} />
                  <Route path="add-motorcycle" element={<AddMotorcyclePage />} />
                  <Route path="edit-motorcycle/:id" element={<AddMotorcyclePage />} />
                  <Route path="service-settings" element={<ServiceSettingsPage />} />
                  <Route path="job-types" element={<JobTypesPage />} />
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