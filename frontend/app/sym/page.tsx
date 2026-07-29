import symHero from '@/assets/sym_22.webp';
import symWarrantyImage from '@/assets/sym_warranty_image.png';
import symWorkshopImage from '@/assets/close_up.jpg';
import { siteSettings } from '@/lib/siteSettings';
import {
  activeLandingBikes,
  carouselBikes,
  exactMake,
  fetchLandingBikes,
} from '@/lib/landingInventory';
import {
  buildBikeListSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildMetadata,
} from '@/lib/seo';
import SearchLandingPage from '@/components/SearchLandingPage';

const path = '/sym';
const newInventoryPath = '/inventory/scooters/new?make=SYM';
const usedInventoryPath = '/inventory/scooters/used?make=SYM';

export const metadata = buildMetadata({
  title: 'SYM Scooters Perth | New & Used SYM Dealer',
  description: 'Perth\'s SYM dealer for new and used SYM scooters. Browse current stock and get SYM servicing, warranty support and repairs from our Dianella workshop.',
  canonicalPath: path,
  image: symHero.src,
});

export const revalidate = 300;

const faqData = [
  {
    question: 'Are you an authorised SYM dealer in Perth?',
    answer: 'Yes. We are a SYM dealership based in Dianella, selling brand-new SYM scooters backed by the official SYM warranty, alongside a changing range of used SYM scooters.',
  },
  {
    question: 'Which new SYM scooters do you sell?',
    answer: 'Our new SYM range spans small-engine models suitable for a car licence moped through to full-size scooters, so it is worth checking current stock or asking us what suits your licence and budget.',
  },
  {
    question: 'Do you also sell used SYM scooters?',
    answer: 'Yes. When trade-ins and used SYM scooters come through our workshop, they are inspected and listed here.',
  },
  {
    question: 'Can I trade in my old bike on a new SYM?',
    answer: 'Yes. We offer a minimum $500 trade-in on new SYM scooters for any running, licensed motorcycle or scooter, regardless of make or model.',
  },
  {
    question: 'Do you service SYM scooters?',
    answer: 'Yes. Our Dianella workshop handles SYM servicing, warranty work, tyres, diagnosis and repairs, whether you bought your SYM from us or elsewhere.',
  },
];

export default async function SymPage() {
  const [newSearchResults, usedSearchResults] = await Promise.all([
    fetchLandingBikes({ condition: 'new,demo', vehicle_type: 'scooter', search: 'sym' }),
    fetchLandingBikes({ condition: 'used', vehicle_type: 'scooter', search: 'sym' }),
  ]);

  const newSyms = exactMake(newSearchResults, 'SYM');
  const usedSyms = exactMake(usedSearchResults, 'SYM');
  const newBikes = carouselBikes(newSyms);
  const usedBikes = carouselBikes(usedSyms);

  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'SYM', path },
    ]),
    buildBikeListSchema([...newSyms, ...usedSyms], 'New & Used SYM Scooters in Perth', path),
  ];

  return (
    <SearchLandingPage
      structuredData={structuredData}
      hero={{
        newBikes: activeLandingBikes(newSyms),
        usedBikes: activeLandingBikes(usedSyms),
        error: null,
        phoneNumber: siteSettings.phone_number,
        mobileNumber: siteSettings.mobile_number,
        emailAddress: siteSettings.email_address,
        headingLines: ['Perth', 'SYM Scooter', 'Dealer'],
        description: 'A genuine SYM dealership in Dianella, stocking new and used SYM scooters with warranty backing and workshop support behind every sale.',
        newPanel: {
          eyebrow: 'Current SYM Stock',
          titleLines: ['New', 'SYM Scooters'],
          href: newInventoryPath,
          linkText: 'See New SYM Scooters',
          alt: 'New SYM scooter for sale at ScooterShop Perth',
          fallbackImage: symWarrantyImage.src,
          imageFit: 'contain',
        },
        usedPanel: {
          eyebrow: 'Current SYM Stock',
          titleLines: ['Used', 'SYM Scooters'],
          mobileTitleLines: ['Used', 'SYM Scooters'],
          href: usedInventoryPath,
          linkText: 'See Used SYM Scooters',
          alt: 'Used SYM scooter for sale at ScooterShop Perth',
          fallbackImage: symHero.src,
          imageFit: 'contain',
        },
        servicePanel: {
          eyebrow: 'SYM Workshop · Perth',
          heading: 'Get Your SYM Serviced.',
          description: 'Warranty servicing, tyres, diagnosis and repairs for SYM scooters at our Dianella workshop.',
          href: '/scooter-service',
          linkText: 'Book Online',
        },
      }}
      newCarousel={{
        title: 'New SYM Scooters',
        bikes: newBikes,
        description: 'As a SYM dealership, here is our current new SYM stock.',
        linkTo: newInventoryPath,
        linkText: 'All New SYM Scooters',
      }}
      usedCarousel={{
        title: 'Used SYM Scooters',
        bikes: usedBikes,
        description: 'Our current and recently sold used SYM scooters.',
        linkTo: usedInventoryPath,
        linkText: 'All Used SYM Scooters',
      }}
      service={{
        eyebrow: 'SYM Workshop · Dianella',
        headingLines: ['Get Your', 'SYM', 'Sorted.'],
        subtitle: 'Backed by warranty know-how and over 30 years of hands-on scooter workshop experience.',
        checkItems: [
          'SYM servicing and warranty repairs',
          'New and used SYM sales',
          'Tyre fitting and wheel balancing',
          'No-start and electrical diagnosis',
          'Carburettor and fuel-system work',
          "Can't ride it in? Pickup can be arranged",
        ],
        href: '/scooter-service',
        buttonText: 'Book SYM Service',
      }}
      storyCards={[
        {
          image: symWarrantyImage,
          alt: 'SYM warranty backing for new scooters at ScooterShop Perth',
          title: 'A Real SYM Dealership',
          subtitle: 'New Scooters, Backed by Warranty',
          description: 'As a SYM dealer, every new SYM we sell comes with full manufacturer warranty backing, plus a workshop that actually knows the range.',
          imageLeft: true,
          href: newInventoryPath,
          buttonText: 'See New SYM Scooters',
        },
        {
          image: symWorkshopImage,
          alt: 'SYM scooter being worked on in the Dianella workshop',
          title: 'Trade In Any Bike on a New SYM',
          subtitle: 'Minimum $500 Trade-In Offer',
          description: 'Running and licensed, any make or model: trade it in for at least $500 off a new SYM, then let our Dianella workshop keep it running for years to come.',
          imageLeft: false,
          href: '/scooter-service',
          buttonText: 'See Scooter Servicing',
        },
      ]}
      faqTitle="SYM Sales & Service Questions"
      faqData={faqData}
      floatingServiceHref="/scooter-service"
    />
  );
}
