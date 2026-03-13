import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import HomeHeroV2 from '@/components/HomeHeroV2';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import { getBikes, getProducts } from '@/api';
import type { Bike } from "@/types/Bike";
import type { Product } from "@/types/Product";
import { siteSettings } from '@/config/siteSettings';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import { Zap, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const [newBikes, setNewBikes] = useState<Bike[]>([]);
  const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const [newBikesResponse, usedBikesResponse, productsResponse] = await Promise.all([
          getBikes({ condition: 'new', page: 1, is_featured: true }),
          getBikes({ condition: 'used', page: 1, is_featured: true }),
          getProducts(),
        ]);

        const availableNewBikes = newBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setNewBikes(availableNewBikes);

        const availableUsedBikes = usedBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setUsedBikes(availableUsedBikes);

        setFeaturedProducts(productsResponse.results.slice(0, 3));

      } catch (err) {
        console.error("Failed to fetch page data:", err);
        setError("Failed to load page data.");
      }
    };

    fetchPageData();
  }, []);

  const faqData = [
    {
      "question": "How can I contact you?",
      "answer": `You can contact us by phone on ${siteSettings.phone_number || '{phone}'}, by email at ${siteSettings.email_address || '{email}'}, or via our Contact Us page.`
    },
    {
      "question": "What types of motorcycles and scooters do you service?",
      "answer": "We service all motorcycles and most scooters. For scooters, we specialise in Italian brands and mid to upper-end Asian brands. Some brands are excluded due to parts availability and build quality concerns, allowing us to maintain reliable, long-lasting repairs. Full details are listed on our service page."
    },
    {
      "question": "What areas of Perth do you service?",
      "answer": `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", Allbikes & Scooters frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    },
    {
      question: 'Do you sell electric scooters?',
      answer: 'Yes! We sell electric scooters (e-scooters) online with free delivery Australia-wide. Visit our E-Scooters page to browse our current range. All prices include GST.'
    }
  ];

  const localBusinessSchema = siteSettings ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Allbikes & Scooters",
    "image": "https://www.scootershop.com.au/logo-512x512.png",
    "url": "https://www.scootershop.com.au",
    "telephone": siteSettings.phone_number,
    "email": siteSettings.email_address,
    "founder": {
      "@type": "Person",
      "name": "Ethan Betts"
    },
    "address": {
        "@type": "PostalAddress",
        "streetAddress": siteSettings.street_address,
        "addressLocality": siteSettings.address_locality,
        "addressRegion": siteSettings.address_region,
        "postalCode": siteSettings.postal_code,
        "addressCountry": "AU" 
    },
    "openingHoursSpecification": [
        { day: "Monday",    hours: siteSettings.opening_hours_monday },
        { day: "Tuesday",   hours: siteSettings.opening_hours_tuesday },
        { day: "Wednesday", hours: siteSettings.opening_hours_wednesday },
        { day: "Thursday",  hours: siteSettings.opening_hours_thursday },
        { day: "Friday",    hours: siteSettings.opening_hours_friday },
        { day: "Saturday",  hours: siteSettings.opening_hours_saturday },
        { day: "Sunday",    hours: siteSettings.opening_hours_sunday },
    ]
    .filter(({ hours }) => hours && !hours.toLowerCase().includes('closed'))
    .map(({ day, hours }) => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day,
        "opens": hours.split('-')[0].trim(),
        "closes": hours.split('-')[1].trim(),
    })),
    "priceRange": "AUD"
} : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Allbikes & Scooters",
    "url": "https://www.scootershop.com.au"
  };

  const structuredData = [];
  if (localBusinessSchema) {
      structuredData.push(localBusinessSchema);
  }
  structuredData.push(webSiteSchema);


  return (
    <div>
      <Seo
        title="Allbikes & Scooters - Perth's Motorcycle and Scooter Dealership"
        description="Discover a wide range of new and used motorcycles and scooters at Allbikes. We offer sales, servicing, and expert advice for riders in Perth."
        canonicalPath="/"
        structuredData={structuredData}
      />
        <HomeHeroV2
            newBikes={newBikes}
            usedBikes={usedBikes}
            error={error}
            phoneNumber={siteSettings.phone_number}
            mobileNumber={siteSettings.mobile_number}
            emailAddress={siteSettings.email_address}
        />
        <ReviewCarousel />
        
        <ServiceCTAV2 />
                <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">New Motorcycles and Scooters</span><span className="md:hidden">New Bikes</span></>}
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/inventory/motorcycles/new"
          linkText="All New Bikes"
        />
        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">Used Motorcycles and Scooters</span><span className="md:hidden">Used Bikes</span></>}
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/inventory/motorcycles/used"
          linkText="All Used Bikes"
        />
        {/* E-Scooter Promo Section */}
        <section className="py-14 px-4 bg-foreground">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Now Selling E-Scooters</h2>
              <p className="text-muted-foreground">Buy online — all prices include GST with free delivery Australia-wide.</p>
            </div>

            {featuredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {featuredProducts.map((product) => {
                  const primaryImage = product.images
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .find((img) => img.order === 0);
                  return (
                    <Link
                      key={product.id}
                      to={`/escooters/${product.slug}`}
                      className="border rounded-lg overflow-hidden bg-background hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {primaryImage?.thumbnail ? (
                          <img
                            src={primaryImage.thumbnail}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Zap className="h-10 w-10 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col gap-1 flex-grow">
                        <p className="font-semibold text-[var(--text-primary)]">{product.name}</p>
                        <p className="text-lg font-bold">${parseFloat(product.price).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">incl. GST</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Truck className="h-3 w-3" />
                          Free Delivery
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="text-center">
              <Button asChild size="lg">
                <Link to="/escooters">View All E-Scooters</Link>
              </Button>
            </div>
          </div>
        </section>

        <BrandsSection />

        <FaqSection title="Frequently Asked Questions" faqData={faqData} />
        <FloatingActionButton /> 
    </div>
  );
};

export default HomePage;

