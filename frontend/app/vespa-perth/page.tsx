import vespaHero from '@/assets/IMG_20250730_102056.webp';
import vespaWorkshopImage from '@/assets/motorcycle_images/vespa-px-150-2013/IMG_20250730_102025.jpg';
import vespaStoryImage from '@/assets/motorcycle_images/vespa-px-150-2013/IMG_20250730_102056.jpg';
import { siteSettings } from '@/config/siteSettings';
import {
  activeLandingBikes,
  exactMake,
  fetchLandingBikes,
  prioritizeLandingBikes,
} from '@/lib/landingInventory';
import {
  buildBikeListSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildMetadata,
} from '@/lib/seo';
import SearchLandingPage from '@/page_components/SearchLandingPage';
import { vespaReviews } from '@/page_components/VespaServicePage';

const path = '/vespa-perth';
const usedInventoryPath = '/inventory/scooters/used';

export const metadata = buildMetadata({
  title: 'Used Vespa Scooters for Sale & Service Perth',
  description: 'Browse used Vespa scooters in Perth and get specialist Vespa servicing from a workshop with over 30 years of hands-on experience.',
  canonicalPath: path,
  image: vespaHero.src,
});

export const revalidate = 300;

const faqData = [
  {
    question: 'Do you sell new Vespa scooters?',
    answer: 'No. We do not sell new Vespas, but we regularly list quality used Vespas. The new-scooter carousel shows other brands we currently sell new.',
  },
  {
    question: 'Which used Vespa models do you stock?',
    answer: 'Stock changes, but it can include models such as the GTS, Sprint, Primavera, LX, ET4 and older two-stroke Vespas. Current and recently sold Vespas appear first on this page.',
  },
  {
    question: 'Do you service Vespa scooters in Perth?',
    answer: 'Yes. Our Dianella workshop has over 30 years of Vespa experience and services modern and classic models, including tyres, diagnosis and mechanical repairs.',
  },
  {
    question: 'Can you help transport a Vespa that is not rideable?',
    answer: 'Yes. We work closely with Perth Motorcycle and Scooter Movers and can help you arrange safe pickup and delivery.',
  },
];

export default async function VespaPerthPage() {
  const [vespaSearchResults, featuredNew, featuredUsed] = await Promise.all([
    fetchLandingBikes({ condition: 'used', vehicle_type: 'scooter', search: 'vespa' }),
    fetchLandingBikes({ condition: 'new,demo', vehicle_type: 'scooter', is_featured: true }),
    fetchLandingBikes({ condition: 'used', vehicle_type: 'scooter', is_featured: true }),
  ]);

  const vespas = exactMake(vespaSearchResults, 'Vespa');
  const usedBikes = prioritizeLandingBikes(vespas, featuredUsed);
  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Vespa Perth', path },
    ]),
    buildBikeListSchema(vespas, 'Used Vespa Scooters in Perth', path),
  ];

  return (
    <SearchLandingPage
      structuredData={structuredData}
      reviews={vespaReviews}
      hero={{
        layout: 'single',
        newBikes: [],
        usedBikes: activeLandingBikes(vespas),
        error: null,
        phoneNumber: siteSettings.phone_number,
        mobileNumber: siteSettings.mobile_number,
        emailAddress: siteSettings.email_address,
        headingLines: ["Perth's", 'Vespa', 'Specialists'],
        description: 'Browse used Vespas and get specialist workshop support from a Perth team with more than 30 years of hands-on Vespa experience.',
        usedPanel: {
          eyebrow: 'Browse Current Inventory',
          titleLines: ['Used', 'Vespa Scooters'],
          href: usedInventoryPath,
          linkText: 'See Used Scooters',
          alt: 'Used Vespa scooter for sale at ScooterShop Perth',
          fallbackImage: vespaHero.src,
          imageFit: 'cover',
        },
        servicePanel: false,
      }}
      newCarousel={{
        title: 'Featured New Scooters',
        bikes: featuredNew,
        description: 'We do not sell new Vespas, but these are some of the new scooters currently available from brands we support.',
        linkTo: '/inventory/scooters/new',
        linkText: 'All New Scooters',
      }}
      usedCarousel={{
        title: 'Used Vespas First',
        bikes: usedBikes,
        description: 'Current and recently sold Vespas appear first, followed by other featured used scooters.',
        linkTo: usedInventoryPath,
        linkText: 'Browse Used Scooters',
      }}
      service={{
        eyebrow: 'Vespa Workshop · Dianella',
        headingLines: ['Get Your', 'Vespa', 'Sorted.'],
        subtitle: "Perth's former primary Vespa dealer, with over 30 years of hands-on experience across modern and classic models.",
        checkItems: [
          'Vespa servicing and mechanical repairs',
          'GTS, Sprint, Primavera, ET4, LX and more',
          'Classic two-stroke Vespa experience',
          'Tyre fitting and wheel balancing',
          'No-start and electrical diagnosis',
          "Can't ride it in? Pickup can be arranged",
        ],
        href: '/vespa-service-perth',
        buttonText: 'Book Vespa Service',
      }}
      storyCards={[
        {
          image: vespaStoryImage,
          alt: 'Classic Vespa at ScooterShop Perth',
          title: 'A Long History with Vespa',
          subtitle: 'Perth Vespa Knowledge Since the 1990s',
          description: "We were once Perth's primary Vespa dealer. That history now helps used-Vespa buyers and owners get practical advice from people who know the models.",
          imageLeft: true,
          href: '/vespa-service-perth',
          buttonText: 'Our Vespa Workshop',
        },
        {
          image: vespaWorkshopImage,
          alt: 'Used Vespa scooter inspected in Perth',
          title: 'Used Vespas with Workshop Support',
          subtitle: 'Buy, Maintain and Enjoy',
          description: 'Our used inventory changes often. When a Vespa is available, it appears first here; our Dianella workshop can then support it with servicing, tyres and repairs.',
          imageLeft: false,
          href: usedInventoryPath,
          buttonText: 'See Used Scooters',
        },
      ]}
      faqTitle="Used Vespa & Service Questions"
      faqData={faqData}
      floatingServiceHref="/vespa-service-perth"
    />
  );
}
