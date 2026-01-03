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
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'));
const BikeListPage = lazy(() => import('./pages/BikeListPage')); // New lazy-loaded page

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
              <Route path="/bikes/new" element={<BikeListPage bikeCondition="new" />} /> {/* New bikes route */}
              <Route path="/bikes/used" element={<BikeListPage bikeCondition="used" />} /> {/* Used bikes route */}

              {/* Admin Section */}
              <Route path="/admin/dashboard" element={<AdminLayout />}>
                <Route index element={<AdminHomePage />} />
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