import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import NavBar from './components/ui/NavBar';
import Footer from './components/ui/Footer';
import HomePage from './pages/HomePage';
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from './components/ui/spinner';

// --- Lazy-loaded Pages ---
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'));

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