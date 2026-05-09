import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "ScooterShop Perth | Motorcycles, Scooters & Servicing",
  description: "Perth's motorcycle and scooter specialists. New and used bike sales, servicing, tyre fitting, and e-scooters. Located in Dianella, WA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
        <SpeedInsights />
      </body>
    </html>
  );
}
