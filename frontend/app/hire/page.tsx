import { buildFaqSchema, buildBreadcrumbSchema, buildServiceSchema, buildMetadata } from '@/lib/seo';
import { getServerHireBikes, getServerHireBlockedDates, getServerPublicHireSettings } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { PublicHireSettings } from '@/types/PublicHireSettings';
import HireListPage from '@/page_components/HireListPage';
import DeferredHireSections from '@/components/DeferredHireSections';

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
  title: 'Motorcycle Hire Perth | Daily, Weekly & Monthly',
  description: 'Hire a motorcycle or scooter in Perth with flexible daily, weekly, and monthly rates from a maintained Dianella hire fleet.',
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
  const [bikes, hireSettings, blockedDates] = await Promise.all([
    fetchInitialHireBikes(startDate, endDate),
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
