import { buildMetadata, SITE_URL } from '@/lib/seo';
import { getServerHireBikes } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import HireListPage from '@/page_components/HireListPage';
import { FaqSection } from '@/components/FaqSection';

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

const hireSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Hire', item: `${SITE_URL}/hire` },
      ],
    },
    {
      '@type': 'Service',
      serviceType: 'Motorcycle and scooter hire',
      url: `${SITE_URL}/hire`,
      provider: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#business`,
        name: 'ScooterShop',
      },
      areaServed: { '@type': 'City', name: 'Perth' },
      description: 'Short and long term motorcycle and scooter hire in Perth, WA. Daily, weekly, and monthly rates available from ScooterShop Dianella.',
    },
  ],
};

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop',
  description: 'Hire a motorcycle in Perth from ScooterShop Dianella. Flexible daily, weekly, and monthly rates with maintained hire bikes.',
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
  const bikes = await fetchInitialHireBikes(startDate, endDate);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hireSchema) }}
      />
      <HireListPage
        initialBikes={bikes}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
      <FaqSection title="Hire FAQs" faqData={hireFaqData} />
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
