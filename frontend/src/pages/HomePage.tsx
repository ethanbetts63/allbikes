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
import { Zap, Truck, ArrowRight } from 'lucide-react';
import stripeLogo from '@/assets/stripe-ar21.svg';

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
          getProducts({ is_featured: true }),
        ]);

        const availableNewBikes = newBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setNewBikes(availableNewBikes);

        const availableUsedBikes = usedBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setUsedBikes(availableUsedBikes);

        setFeaturedProducts(productsResponse.results.slice(0, 2));

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
        description="Discover a wide range of new and Used Motorcycles & Scooters at Allbikes. We offer sales, servicing, and expert advice for riders in Perth."
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
          title={<>Featured <span className="hidden md:inline">New Motorcycles & Scooters</span><span className="md:hidden">New Bikes</span></>}
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/inventory/motorcycles/new"
          linkText="All New Bikes"
        />
        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">Used Motorcycles & Scooters</span><span className="md:hidden">Used Bikes</span></>}
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/inventory/motorcycles/used"
          linkText="All Used Bikes"
        />
        {/* E-Scooter Promo Section */}
        <section className="bg-stone-900 py-14 px-6">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.25em]">
                  Buy Online
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500 text-[10px] uppercase tracking-widest">Powered by</span>
                  <img src={stripeLogo} alt="Stripe" className="h-4 w-auto" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-white text-3xl md:text-4xl font-black uppercase italic leading-none">
                  Best Selling<br />E-Scooters
                </h2>
                <Link
                  to="/escooters"
                  className="hidden sm:inline-flex items-center gap-2 shrink-0 border border-amber-400 text-amber-400 hover:border-stone-500 hover:text-stone-500 font-bold text-xs uppercase tracking-widest px-4 py-2.5 transition-colors duration-200"
                >
                  View All E-Scooters <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Free delivery banner */}
            <div className="flex items-center gap-3 bg-stone-800 px-5 py-3 mb-6 w-fit">
              <Truck className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="text-white text-sm font-bold uppercase tracking-widest">Free Delivery Australia-Wide</span>
            </div>

            {/* Product tiles */}
            {featuredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {featuredProducts.map((product) => {
                  const primaryImage = [...product.images].sort((a, b) => a.order - b.order)[0];
                  const imageUrl = primaryImage?.thumbnail || primaryImage?.image;
                  const displayPrice = product.discount_price && parseFloat(product.discount_price) > 0
                    ? product.discount_price
                    : product.price;
                  return (
                    <Link
                      key={product.id}
                      to={`/escooters/${product.slug}`}
                      className="group bg-white rounded-lg overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-200"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Zap className="h-10 w-10 text-stone-300" />
                          </div>
                        )}
                        {!product.in_stock && (
                          <span className="absolute top-3 left-3 bg-stone-900/80 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            Out of Stock
                          </span>
                        )}
                        {product.low_stock && product.in_stock && (
                          <span className="absolute top-3 left-3 bg-stone-900/80 text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-4 flex flex-col gap-1 flex-1">
                        {product.brand && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{product.brand}</p>
                        )}
                        <p className="font-bold text-stone-900 text-lg leading-snug">{product.name}</p>
                        <div className="mt-auto pt-2 flex items-end justify-between">
                          <div>
                            {product.discount_price && parseFloat(product.discount_price) > 0 ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-stone-400 line-through text-sm">${parseFloat(product.price).toLocaleString()}</span>
                                <span className="text-amber-500 font-black text-xl">${parseFloat(product.discount_price).toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="text-stone-900 font-black text-xl">${parseFloat(displayPrice).toLocaleString()}</span>
                            )}
                            <p className="text-xs text-stone-500 mt-0.5">incl. GST</p>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 group-hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              to="/escooters"
              className="sm:hidden inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm uppercase tracking-widest px-6 py-3 transition-colors duration-200"
            >
              View All E-Scooters
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </section>

        <BrandsSection />

        <FaqSection title="Frequently Asked Questions" faqData={faqData} />
        <FloatingActionButton /> 
    </div>
  );
};

export default HomePage;

