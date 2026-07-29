import jetLifestyle from '@/assets/Jet 14 EVO 125 2.webp';
import symImage from '@/assets/sym_22.webp';
import { siteSettings } from '@/lib/siteSettings';
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

const path = '/125cc-scooters-perth';
const newInventoryPath = '/inventory/scooters/new?max_engine_size=125';
const usedInventoryPath = '/inventory/scooters/used?max_engine_size=125';

export const metadata = buildMetadata({
  title: '125cc Scooters Perth | New & Used 125cc Scooters for Sale',
  description: 'Browse new and used 125cc scooters for sale in Perth. Check current stock, find out which licence a 125cc scooter needs (it is not the same as a 50cc moped), or book it in for a service.',
  canonicalPath: path,
  image: jetLifestyle.src,
});

export const revalidate = 300;

const faqData = [
  {
    question: 'Do I need a special licence for a 125cc scooter in WA?',
    answer: 'Yes. Unlike a 50cc moped, which can be ridden on a car licence, a 125cc scooter requires a motorcycle licence (or a current learner/provisional motorcycle permit) before you can ride it on WA roads.',
  },
  {
    question: 'Is a 125cc scooter a moped?',
    answer: 'No. In WA, a moped is capped at 50cc and a lower top speed, so a 125cc scooter falls outside the moped definition and into standard motorcycle licensing.',
  },
  {
    question: 'Do you sell both new and used 125cc scooters?',
    answer: 'Yes, we do. Our current new and used 125cc stock is shown on this page.',
  },
  {
    question: 'Is a 125cc scooter a good option for getting around Perth?',
    answer: 'For a lot of riders, yes. Compared with a 50cc moped, a 125cc scooter has the extra power to handle hills, highway on-ramps and carrying a pillion, while still keeping fuel, insurance and running costs low.',
  },
  {
    question: 'Can you service my 125cc scooter?',
    answer: 'Yes. Our Dianella workshop handles routine servicing, tyres, no-start diagnosis and running repairs on 125cc scooters.',
  },
];

export default async function OneTwentyFiveCcScootersPage() {
  const [targetNew, targetUsed] = await Promise.all([
    fetchLandingBikes({ condition: 'new,demo', vehicle_type: 'scooter', max_engine_size: 125 }),
    fetchLandingBikes({ condition: 'used', vehicle_type: 'scooter', max_engine_size: 125 }),
  ]);

  const targetBikes = prioritizeLandingBikes([...targetNew, ...targetUsed]);
  const newBikes = carouselBikes(targetNew);
  const usedBikes = carouselBikes(targetUsed);

  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: '125cc Scooters Perth', path },
    ]),
    buildBikeListSchema(targetBikes, '125cc Scooters for Sale in Perth', path),
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
        headingLines: ['Perth', '125cc Scooter', 'Headquarters'],
        description: '125cc mopeds/scooters, backed by honest buying advice and workshop support from a Dianella team with over 30 years of experience.',
        newPanel: {
          eyebrow: 'Current 125cc Stock',
          titleLines: ['New', '125cc Scooters'],
          href: newInventoryPath,
          linkText: 'See New 125cc Scooters',
          alt: 'New 125cc scooter for sale at ScooterShop Perth',
          fallbackImage: jetLifestyle.src,
          imageFit: 'cover',
        },
        usedPanel: {
          eyebrow: 'Current 125cc Stock',
          titleLines: ['Used', '125cc Scooters'],
          mobileTitleLines: ['Used', '125cc Scooters'],
          href: usedInventoryPath,
          linkText: 'See Used 125cc Scooters',
          alt: 'Used 125cc scooter for sale at ScooterShop Perth',
          fallbackImage: symImage.src,
          imageFit: 'cover',
        },
        servicePanel: {
          eyebrow: 'ScooterShop · Perth',
          heading: 'Get Your 125cc Scooter Serviced.',
          description: 'Servicing, tyres, fault diagnosis and repairs for 125cc scooters at our Dianella workshop.',
          href: '/scooter-service',
          linkText: 'Book Online',
        },
      }}
      newCarousel={{
        title: 'New 125cc Stock',
        bikes: newBikes,
        description: 'Our current new 125cc scooters.',
        linkTo: newInventoryPath,
        linkText: 'All New 125cc Scooters',
      }}
      usedCarousel={{
        title: 'Used 125cc Stock',
        bikes: usedBikes,
        description: 'Second-hand 125cc scooters we have available or have recently sold.',
        linkTo: usedInventoryPath,
        linkText: 'All Used 125cc Scooters',
      }}
      service={{
        eyebrow: '125cc Scooter Workshop · Dianella',
        headingLines: ['Keep Your', '125cc Scooter', 'Running.'],
        subtitle: 'From routine servicing to tyres and no-start diagnosis, our mechanics work on scooters every day of the week.',
        checkItems: [
          '125cc scooter servicing and repairs',
          'Tyre fitting and wheel balancing',
          'No-start and electrical diagnosis',
          'Carburettor and fuel-system work',
          '125cc scooters from all major brands, not just mopeds',
          "Can't ride it in? Pickup can be arranged",
        ],
        href: '/scooter-service',
        buttonText: 'Book 125cc Service',
      }}
      storyCards={[
        {
          image: jetLifestyle,
          alt: '125cc scooter being ridden in Perth',
          title: 'Moped or Motorcycle Licence? Know the Difference',
          subtitle: '125cc Licence Rules in WA',
          description: 'A 50cc moped and a 125cc scooter are not covered by the same licence. Our plain-English guide breaks down the engine, speed and licence rules so you choose the right bike from the start.',
          imageLeft: true,
          href: '/blog/wa-scooter-motorcycle-licence-guide',
          buttonText: 'Read the Licence Guide',
        },
        {
          image: symImage,
          alt: 'SYM scooter supported by ScooterShop Perth',
          title: 'Backed by a Workshop, Not Just a Showroom',
          subtitle: 'Real Support After the Sale',
          description: 'Every scooter we sell is inspected by our own mechanics, and our Dianella workshop is on hand afterwards for servicing, tyres and repairs.',
          imageLeft: false,
          href: '/scooter-service',
          buttonText: 'See Scooter Servicing',
        },
      ]}
      faqTitle="125cc Scooter Questions"
      faqData={faqData}
      floatingServiceHref="/scooter-service"
    />
  );
}
