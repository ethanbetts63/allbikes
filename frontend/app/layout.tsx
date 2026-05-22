import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Motorcycles, Scooters & Servicing Perth",
  description: "Perth motorcycle and scooter specialists for new and used bike sales, servicing, tyre fitting, and e-scooters in Dianella, WA.",
  icons: {
    icon: [
      { url: '/logo-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/logo-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/logo-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.scootershop.com.au" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.scootershop.com.au" />
      </head>
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster position="top-center" richColors />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
