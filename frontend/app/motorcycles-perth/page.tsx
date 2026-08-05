import motorcycleHero from '@/assets/movers.webp';
import newScooterImage from '@/assets/sym_22.webp';
import workshopImage from '@/assets/close_up.jpg';
import { siteSettings } from '@/lib/siteSettings';
import {
  activeLandingBikes,
  carouselBikes,
  fetchLandingBikes,
} from '@/lib/landingInventory';
import {
  buildBikeListSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildMetadata,
} from '@/lib/seo';
import SearchLandingPage from '@/components/marketing/SearchLandingPage';

const path = '/motorcycles-perth';
const usedInventoryPath = '/inventory/motorcycles/used';
const newScooterInventoryPath = '/inventory/scooters/new';

export const metadata = buildMetadata({
  title: 'Used Motorcycles for Sale & Service Perth | ScooterShop',
  description: 'Browse used motorcycles for sale in Perth, backed by motorcycle servicing, repairs and tyre fitting from our Dianella workshop.',
  canonicalPath: path,
  image: motorcycleHero.src,
});

export const revalidate = 300;

const faqData = [
  {
    question: 'Do you sell new motorcycles?',
    answer: 'No. Our motorcycle range is used only. We do sell new scooters, which are shown separately on this page.',
  },
  {
    question: 'Are used motorcycles inspected before sale?',
    answer: 'Yes. Used motorcycles are inspected and prepared by our Dianella workshop before being listed for sale.',
  },
  {
    question: 'Do you service all motorcycle brands?',
    answer: 'Yes. Our workshop services and repairs road bikes and dirt bikes across major makes, including Honda, Yamaha, Kawasaki, Suzuki, Ducati, Triumph, BMW, KTM and more.',
  },
  {
    question: 'Can you fit motorcycle tyres?',
    answer: 'Yes. We offer motorcycle tyre supply and fitting, fit-only jobs, puncture repairs and wheel balancing for a wide range of tyre sizes and riding styles.',
  },
];

export default async function MotorcyclesPerthPage() {
  const [usedMotorcycles, newScooters] = await Promise.all([
    fetchLandingBikes({ condition: 'used', vehicle_type: 'motorcycle' }),
    fetchLandingBikes({ condition: 'new,demo', vehicle_type: 'scooter' }),
  ]);

  const usedBikes = carouselBikes(usedMotorcycles);
  const newBikes = carouselBikes(newScooters);
  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Motorcycles Perth', path },
    ]),
    buildBikeListSchema(usedMotorcycles, 'Used Motorcycles for Sale in Perth', path),
  ];

  return (
    <SearchLandingPage
      structuredData={structuredData}
      hero={{
        layout: 'single',
        newBikes: activeLandingBikes(newScooters),
        usedBikes: activeLandingBikes(usedMotorcycles),
        error: null,
        phoneNumber: siteSettings.phone_number,
        mobileNumber: siteSettings.mobile_number,
        emailAddress: siteSettings.email_address,
        headingLines: ["Perth's", 'Used Motorcycle', 'Specialists'],
        description: 'Quality used motorcycles, expert workshop support and tyre fitting from a Dianella team with more than 30 years of experience.',
        newPanel: {
          eyebrow: 'New Scooter Stock',
          titleLines: ['New', 'Scooters'],
          href: newScooterInventoryPath,
          linkText: 'See New Scooters',
          alt: 'New scooters for sale at ScooterShop Perth',
          fallbackImage: newScooterImage.src,
          imageFit: 'contain',
        },
        usedPanel: {
          eyebrow: 'Current Motorcycle Stock',
          titleLines: ['Used', 'Motorcycles'],
          mobileTitleLines: ['Used', 'Motorcycles'],
          href: usedInventoryPath,
          linkText: 'See Used Motorcycles',
          alt: 'Used motorcycles for sale at ScooterShop Perth',
          fallbackImage: motorcycleHero.src,
          imageFit: 'cover',
        },
        servicePanel: {
          eyebrow: 'Motorcycle Workshop · Perth',
          heading: 'Get Your Motorcycle Sorted.',
          description: 'Servicing, repairs, diagnosis and tyre fitting for motorcycles at our Dianella workshop.',
          href: '/motorcycle-service',
          linkText: 'Book Online',
        },
      }}
      newCarousel={{
        title: 'Used Motorcycles',
        bikes: usedBikes,
        description: 'Our current and recently sold used motorcycles, workshop-prepared for Perth riders.',
        linkTo: usedInventoryPath,
        linkText: 'All Used Motorcycles',
      }}
      usedCarousel={{
        title: 'New Scooters',
        bikes: newBikes,
        description: 'We do not sell new motorcycles, but these are the new scooters currently available from brands we support.',
        linkTo: newScooterInventoryPath,
        linkText: 'All New Scooters',
      }}
      service={{
        eyebrow: 'Motorcycle Workshop · Dianella',
        headingLines: ['Get Your', 'Motorcycle', 'Sorted.'],
        subtitle: 'Experienced mechanics for used-motorcycle buyers and riders across Perth.',
        checkItems: [
          'Motorcycle servicing and mechanical repairs',
          'Honda, Yamaha, Kawasaki, Suzuki, Ducati and more',
          'Tyre fitting and wheel balancing',
          'Puncture repairs and flat-tyre help',
          'No-start and running diagnosis',
          "Can't ride it in? Pickup can be arranged",
        ],
        href: '/motorcycle-service',
        buttonText: 'Book Motorcycle Service',
      }}
      storyCards={[
        {
          image: workshopImage,
          alt: 'Motorcycle being worked on at ScooterShop Perth',
          title: 'Used Bikes, Backed by a Real Workshop',
          subtitle: 'Support Beyond the Sale',
          description: 'Our workshop prepares the motorcycles we sell and is here for servicing, repairs and practical advice once you are on the road.',
          imageLeft: true,
          href: '/motorcycle-service',
          buttonText: 'See Motorcycle Servicing',
        },
        {
          image: motorcycleHero,
          alt: 'Motorcycle ready for transport in Perth',
          title: 'Motorcycle Tyre Fitting',
          subtitle: 'Supply and Fit, or Fit Only',
          description: 'Need new tyres, a puncture repair or wheel balancing? Our Dianella workshop handles tyre work for motorcycles of all makes and sizes.',
          imageLeft: false,
          href: '/tyre-fitting',
          buttonText: 'See Tyre Fitting',
        },
      ]}
      faqTitle="Used Motorcycle & Workshop Questions"
      faqData={faqData}
      floatingServiceHref="/motorcycle-service"
    />
  );
}
