import type { Metadata } from 'next';
import { getPartsModels } from '@/lib/partsApi';
import PartsLandingPage from '@/page_components/parts/PartsLandingPage';

export const metadata: Metadata = {
  title: 'SYM Spare Parts | Genuine Parts Online',
  description:
    'Order genuine SYM scooter and motorcycle spare parts online. Browse by model and section, find the exact part from the exploded diagrams, and check live availability.',
};

export const revalidate = 300;

export default async function Page() {
  const models = await getPartsModels();
  return <PartsLandingPage models={models} />;
}
