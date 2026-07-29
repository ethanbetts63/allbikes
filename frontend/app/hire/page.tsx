import HireAvailabilitySection from '@/app/hire/_components/HireAvailabilitySection';
import HireConfidenceSection from '@/app/hire/_components/HireConfidenceSection';
import FeaturedBikes from '@/components/catalog/FeaturedBikes';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { PublicHireSettings } from '@/types/PublicHireSettings';
import { buildFaqSchema, buildBreadcrumbSchema, buildServiceSchema, buildMetadata } from '@/lib/seo';
import { getServerBikes, getServerHireBikes, getServerHireBlockedDates, getServerPublicHireSettings } from '@/lib/serverApi';
import DeferredHireSections from '@/app/hire/_components/DeferredHireSections';

const hireFaqData = [
  {
    question: 'Do I need a motorcycle licence to hire a bike?',
    answer: 'No. You only need a motorcycle licence to ride bikes larger than 50cc. We have a range of scooters and small bikes that can be hired with a car licence. Please check the specific requirements for each bike on our hire page.',
  },
  {
    question: 'How does the bond work?',
    answer: 'A refundable bond is collected in-store when you pick up the bike. It is returned in full once the bike is back with us in good condition.',
  },
  {
    question: 'What is included in the hire?',
    answer: 'The hire fee covers the use of the motorcycle for your chosen period. The bike comes serviced and ready to ride. Fuel is not included — you return the bike with the same amount of fuel as when you collected it.',
  },
  {
    question: 'Can I extend my hire period?',
    answer: "Extensions are subject to availability. Contact us as early as possible if you need to extend and we'll do our best to accommodate you.",
  },
  {
    question: 'What happens if I damage the bike?',
    answer: 'Any damage beyond normal wear and tear will be assessed and deducted from your bond. Significant damage may incur additional costs. Our hire terms and conditions cover this in detail.',
  },
];

const hireStructuredData = [
  buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Hire', path: '/hire' },
  ]),
  buildServiceSchema({
    serviceType: 'Motorcycle and scooter hire',
    path: '/hire',
    description:
      'Short and long term motorcycle and scooter hire in Perth, WA. Daily, weekly, and monthly rates available from ScooterShop Dianella.',
  }),
  buildFaqSchema(hireFaqData),
].filter(Boolean) as object[];

export const metadata = buildMetadata({
  title: 'Motorcycle & Moped Hire Perth | From $26/Day',
  description: 'Hire a motorcycle or scooter in Perth from $26/day. Daily, weekly, and monthly rates available. No motorcycle licence needed for 50cc bikes. Book online.',
  canonicalPath: '/hire',
});

interface HirePageProps {
  searchParams?: Promise<{
    start?: string;
    end?: string;
  }>;
}

export default async function Page({ searchParams }: HirePageProps) {
  const params = await searchParams;
  const startDate = typeof params?.start === 'string' ? params.start : '';
  const endDate = typeof params?.end === 'string' ? params.end : '';
  const fullHireFleetPromise = fetchInitialHireBikes('', '');
  const selectedHireBikesPromise = startDate && endDate
    ? fetchInitialHireBikes(startDate, endDate)
    : fullHireFleetPromise;
  const [bikes, fullHireFleet, bargainBikes, hireSettings, blockedDates] = await Promise.all([
    selectedHireBikesPromise,
    fullHireFleetPromise,
    fetchBargainBikes(),
    fetchInitialHireSettings(),
    fetchInitialBlockedDates(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hireStructuredData) }}
      />
      <HireListPage
        initialBikes={bikes}
        hasHireFleet={fullHireFleet.length > 0}
        bargainBikes={bargainBikes}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialHireSettings={hireSettings}
        initialBlockedDates={blockedDates}
      />
      <DeferredHireSections faqData={hireFaqData} />
    </>
  );
}

async function fetchInitialHireBikes(startDate: string, endDate: string): Promise<Bike[]> {
  try {
    return await getServerHireBikes(startDate || undefined, endDate || undefined);
  } catch (error) {
    console.error('Failed to server-render hire bikes:', error);
    return [];
  }
}

async function fetchBargainBikes(): Promise<Bike[]> {
  const params = new URLSearchParams({
    condition: 'new,used',
    status: 'for_sale',
    ordering: 'price_asc',
    page_size: '100',
  });

  try {
    const response = await getServerBikes(params);
    return response.results
      .filter((bike) => !bike.is_hire)
      .sort((a, b) => {
        const aPrice = Number(a.discount_price) > 0 ? Number(a.discount_price) : Number(a.price);
        const bPrice = Number(b.discount_price) > 0 ? Number(b.discount_price) : Number(b.price);
        return aPrice - bPrice;
      })
      .slice(0, 8);
  } catch (error) {
    console.error('Failed to server-render bargain bikes:', error);
    return [];
  }
}

async function fetchInitialHireSettings(): Promise<PublicHireSettings | null> {
  try {
    return await getServerPublicHireSettings();
  } catch (error) {
    console.error('Failed to server-render hire settings:', error);
    return null;
  }
}

async function fetchInitialBlockedDates(): Promise<HireBlockedDate[]> {
  try {
    return await getServerHireBlockedDates();
  } catch (error) {
    console.error('Failed to server-render hire blocked dates:', error);
    return [];
  }
}

interface HireListPageProps {
  initialBikes?: Bike[];
  hasHireFleet?: boolean;
  bargainBikes?: Bike[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialHireSettings?: PublicHireSettings | null;
  initialBlockedDates?: HireBlockedDate[];
}

const HireListPage = ({
  initialBikes,
  hasHireFleet = true,
  bargainBikes = [],
  initialStartDate,
  initialEndDate,
  initialHireSettings,
  initialBlockedDates = [],
}: HireListPageProps) => (
  <>
    <HireAvailabilitySection
      initialBikes={initialBikes}
      hasHireFleet={hasHireFleet}
      initialStartDate={initialStartDate}
      initialEndDate={initialEndDate}
      initialHireSettings={initialHireSettings}
      initialBlockedDates={initialBlockedDates}
      emptyState={(
        <section className="bg-[var(--card)] pt-10">
          <div className="container mx-auto px-4 pb-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-dark-primary)] leading-tight mb-3">
              Sorry, Our Hire Bikes Are Fully Booked Right Now.
            </h2>
            <p className="text-lg text-[var(--text-dark-secondary)]">
              You might be interested in one of these bargain deals below instead.
            </p>
          </div>
          <FeaturedBikes
            title="Bargain Bikes for Sale"
            bikes={bargainBikes}
            description="Eight of our cheapest new and used bikes currently available to buy."
            linkTo="/inventory/motorcycles/used"
            linkText="Browse Used Bikes"
          />
        </section>
      )}
    />

    <HireConfidenceSection
      weeklyDiscountPercent={initialHireSettings?.weekly_discount_percent ?? null}
      monthlyDiscountPercent={initialHireSettings?.monthly_discount_percent ?? null}
    />
  </>
);
