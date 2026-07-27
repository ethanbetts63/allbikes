import croxLifestyle from '@/assets/Crox 50 9.webp';
import symImage from '@/assets/sym_22.webp';
import { siteSettings } from '@/config/siteSettings';
import {
  activeLandingBikes,
  carouselBikes,
  fetchLandingBikes,
  prioritizeLandingBikes,
} from '@/lib/landingInventory';
import {
  buildBikeListSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildMetadata,
} from '@/lib/seo';
import SearchLandingPage from '@/components/SearchLandingPage';

const path = '/50cc-scooters-perth';
const newInventoryPath = '/inventory/scooters/new?max_engine_size=50';
const usedInventoryPath = '/inventory/scooters/used?max_engine_size=50';

export const metadata = buildMetadata({
  title: '50cc Scooters for Sale Perth | New & Used Mopeds',
  description: 'Shop new and used 50cc scooters and mopeds in Perth. View current stock, learn which mopeds can be ridden on a WA car licence, or book workshop servicing.',
  canonicalPath: path,
  image: croxLifestyle.src,
});

export const revalidate = 300;

const faqData = [
  {
    question: 'Can I ride a 50cc scooter on a WA car licence?',
    answer: 'An unrestricted WA car licence permits you to ride a moped: a scooter or motorcycle with an engine no larger than 50cc that is designed not to exceed 50 km/h. Engine size alone does not make every 50cc model car-licence legal, so check the vehicle classification before buying.',
  },
  {
    question: 'Do you sell both new and used 50cc scooters/mopeds?',
    answer: 'Yes. This page shows our current new and used petrol scooters up to 50cc.',
  },
  {
    question: 'Are 50cc scooters suitable for Perth commuting?',
    answer: 'They can be an economical choice for short, lower-speed urban trips. Their speed and road suitability vary by model, so we can help match a scooter to your route and licence. Above all, people love them becuase they are cheap. Cheap on fuel, cheap on insurance, cheap to park, cheap to maintain, and cheap to buy. If you are looking for a cheap way to get around Perth, a 50cc scooter is a great option.',
  },
  {
    question: 'Do you service 50cc scooters?',
    answer: 'Yes. Our Dianella workshop services and repairs 50cc scooters, including routine maintenance, tyres, no-start diagnosis and running repairs.',
  },
];

export default async function FiftyCcScootersPage() {
  const [targetNew, targetUsed] = await Promise.all([
    fetchLandingBikes({ condition: 'new,demo', vehicle_type: 'scooter', max_engine_size: 50 }),
    fetchLandingBikes({ condition: 'used', vehicle_type: 'scooter', max_engine_size: 50 }),
  ]);

  const targetBikes = prioritizeLandingBikes([...targetNew, ...targetUsed]);
  const newBikes = carouselBikes(targetNew);
  const usedBikes = carouselBikes(targetUsed);

  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: '50cc Scooters Perth', path },
    ]),
    buildBikeListSchema(targetBikes, '50cc Scooters for Sale in Perth', path),
  ];

  return (
    <SearchLandingPage
      structuredData={structuredData}
      hero={{
        newBikes: activeLandingBikes(targetNew),
        usedBikes: activeLandingBikes(targetUsed),
        error: null,
        phoneNumber: siteSettings.phone_number,
        mobileNumber: siteSettings.mobile_number,
        emailAddress: siteSettings.email_address,
        headingLines: ["Perth's", '50cc Scooter', 'Specialists'],
        description: 'New and used 50cc scooters and mopeds, practical buying advice, and workshop support from a Dianella team with over 30 years of experience.',
        newPanel: {
          eyebrow: 'Current 50cc Stock',
          titleLines: ['New', '50cc Scooters'],
          href: newInventoryPath,
          linkText: 'See New 50cc Scooters',
          alt: 'New 50cc scooter for sale at ScooterShop Perth',
          fallbackImage: croxLifestyle.src,
          imageFit: 'cover',
        },
        usedPanel: {
          eyebrow: 'Current 50cc Stock',
          titleLines: ['Used', '50cc Scooters'],
          mobileTitleLines: ['Used', '50cc Scooters'],
          href: usedInventoryPath,
          linkText: 'See Used 50cc Scooters',
          alt: 'Used 50cc scooter for sale at ScooterShop Perth',
          fallbackImage: symImage.src,
          imageFit: 'cover',
        },
        servicePanel: {
          eyebrow: 'ScooterShop · Perth',
          heading: 'Get Your 50cc Scooter Serviced.',
          description: 'Servicing, tyres, fault diagnosis and repairs for petrol scooters at our Dianella workshop.',
          href: '/scooter-service',
          linkText: 'Book Online',
        },
      }}
      newCarousel={{
        title: '50cc Scooters',
        bikes: newBikes,
        description: 'Our current new 50cc stock.',
        linkTo: newInventoryPath,
        linkText: 'All New 50cc Scooters',
      }}
      usedCarousel={{
        title: 'Used 50cc Scooters',
        bikes: usedBikes,
        description: 'Available and recently sold 50cc scooters.',
        linkTo: usedInventoryPath,
        linkText: 'All Used 50cc Scooters',
      }}
      service={{
        eyebrow: '50cc Scooter Workshop · Dianella',
        headingLines: ['Get Your', '50cc Scooter', 'Sorted.'],
        subtitle: 'Routine service, tyres, no-start diagnosis and running repairs from mechanics who work on scooters every day.',
        checkItems: [
          '50cc scooter servicing and repairs',
          'Tyre fitting and wheel balancing',
          'No-start and electrical diagnosis',
          'Carburettor and fuel-system work',
          'Petrol scooters from all major brands',
          "Can't ride it in? Pickup can be arranged",
        ],
        href: '/scooter-service',
        buttonText: 'Book 50cc Service',
      }}
      storyCards={[
        {
          image: croxLifestyle,
          alt: '50cc scooter being ridden in Perth',
          title: '50cc Scooter Licence Rules in WA',
          subtitle: 'Know What Counts as a Moped',
          description: 'A 50cc engine is only part of the WA moped definition. Read our plain-English guide to the engine, speed and licence rules before choosing a scooter.',
          imageLeft: true,
          href: '/blog/wa-scooter-motorcycle-licence-guide',
          buttonText: 'Read the Licence Guide',
        },
        {
          image: symImage,
          alt: 'SYM scooter supported by ScooterShop Perth',
          title: 'Sales Backed by a Real Workshop',
          subtitle: 'Support Beyond the Showroom',
          description: 'We inspect the scooters we sell and support Perth riders with servicing, tyres and repairs from our Dianella workshop.',
          imageLeft: false,
          href: '/scooter-service',
          buttonText: 'See Scooter Servicing',
        },
      ]}
      faqTitle="50cc Scooter Questions"
      faqData={faqData}
      floatingServiceHref="/scooter-service"
    />
  );
}
