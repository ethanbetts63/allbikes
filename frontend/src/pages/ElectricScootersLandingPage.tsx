import { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import EScooterHero from '@/components/EScooterHero';
import EScooterUSPs from '@/components/EScooterUSPs';
import FeaturedEScooters from '@/components/FeaturedEScooters';
import EScooterWhyBuySection from '@/components/EScooterWhyBuySection';
import EScooterMopedsSection from '@/components/EScooterMopedsSection';
import PayLaterSection from '@/components/PayLaterSection';
import { FaqSection } from '@/components/FaqSection';
import { getProducts } from '@/api';
import type { Product } from '@/types/Product';
import { siteSettings } from '@/config/siteSettings';

const faqData = [
  {
    question: 'Can I buy an electric scooter online and have it delivered anywhere in Australia?',
    answer: 'Yes. We ship Australia-wide with free delivery on every order. Whether you\'re in Perth, Sydney, Melbourne, Brisbane, or a regional area — your e-scooter will be delivered to your door at no extra charge.',
  },
  {
    question: 'Are your electric scooter prices inclusive of GST?',
    answer: 'Yes, all prices displayed on this site include GST. There are no additional taxes or hidden fees added at checkout.',
  },
  {
    question: 'How do I buy an electric scooter online?',
    answer: 'Simply browse the range on our E-Scooters page, click the model you\'re interested in, and hit Buy Now. Payment is handled securely by Stripe. You\'ll receive an order confirmation email immediately after purchase.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards via Stripe, as well as buy now, pay later options including Afterpay, Klarna, and Zip.',
  },
  {
    question: 'Do electric scooters come with a warranty?',
    answer: 'Yes. Every e-scooter we sell comes with a 12-month manufacturer warranty.',
  },
  {
    question: 'Do you service electric scooters?',
    answer: 'Yes. Our workshop in Dianella, Perth services electric scooters and electric mopeds. If you purchase from us and need a service or repair down the track, we\'re here to help.',
  },
  {
    question: 'Are electric scooters legal to ride in Australia?',
    answer: 'Regulations vary by state and territory. In general, electric scooters (e-scooters) are legal on private property, but rules for public roads, footpaths, and shared paths differ across states. We recommend checking your state or territory\'s road authority for the current rules before riding in public.',
  },
  {
    question: 'What is the range of an electric scooter?',
    answer: 'Range depends on the model, rider weight, terrain, and speed. Most of the e-scooters we carry offer a practical range of 25–60 km per charge. Check each product listing for specific range specifications.',
  },
];

const structuredDataBase = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.scootershop.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Electric Scooters", "item": "https://www.scootershop.com.au/electric-scooters" },
      ]
    },
    {
      "@type": "LocalBusiness",
      "name": "Allbikes & Scooters",
      "url": "https://www.scootershop.com.au",
      "telephone": siteSettings.phone_number,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": siteSettings.street_address,
        "addressLocality": siteSettings.address_locality,
        "addressRegion": siteSettings.address_region,
        "postalCode": siteSettings.postal_code,
        "addressCountry": "AU"
      },
      "description": "Perth motorcycle and scooter dealership offering electric scooters for sale online with free delivery Australia-wide."
    }
  ]
};

const ElectricScootersLandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts({ is_featured: true })
      .then(res => setFeaturedProducts(res.results.slice(0, 2)))
      .catch(() => {/* silently fail — FeaturedEScooters renders nothing on empty */});
  }, []);

  return (
    <div>
      <Seo
        title="Buy Electric Scooters Online — Free Delivery Australia-Wide | Scooter Shop"
        description="Shop electric scooters online with free delivery Australia-wide. All prices include GST. Secure checkout via Stripe. 12-month warranty on every e-scooter."
        canonicalPath="/electric-scooters"
        structuredData={structuredDataBase}
      />

      <EScooterHero />

      <EScooterUSPs />

      {!siteSettings.hide_escooters && <FeaturedEScooters products={featuredProducts} />}

      <EScooterMopedsSection />

      <EScooterWhyBuySection />

      <PayLaterSection />

      <FaqSection
        title="Electric Scooter FAQs"
        faqData={faqData}
      />
    </div>
  );
};

export default ElectricScootersLandingPage;
