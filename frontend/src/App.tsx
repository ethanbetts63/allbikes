import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from './components/ui/spinner';

// --- Lazy-loaded Pages ---
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'));
const InventoryManagementPage = lazy(() => import('./pages/admin/InventoryManagementPage'));
const AddMotorcyclePage = lazy(() => import('./pages/admin/AddMotorcyclePage'));
const SiteSettingsPage = lazy(() => import('./pages/admin/SiteSettingsPage'));
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'));
const BikeListPage = lazy(() => import('./pages/BikeListPage'));
const BikeDetailPage = lazy(() => import('./pages/BikeDetailPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));

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
        <Toaster position="top-center" />
        <main className="flex-grow">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/workshop" element={<WorkshopPage />} />
              <Route path="/bikes/new" element={<BikeListPage bikeCondition="new" />} />
              <Route path="/bikes/used" element={<BikeListPage bikeCondition="used" />} />
              <Route path="/bikes/:id" element={<BikeDetailPage />} />
              <Route path="/booking" element={<BookingPage />} />

              {/* Admin Section */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminHomePage />} />
                <Route path="inventory" element={<InventoryManagementPage />} />
                <Route path="add-motorcycle" element={<AddMotorcyclePage />} />
                <Route path="edit-motorcycle/:id" element={<AddMotorcyclePage />} />
                <Route path="settings" element={<SiteSettingsPage />} />
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