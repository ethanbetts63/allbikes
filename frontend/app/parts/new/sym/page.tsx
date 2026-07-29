import { getPartsModels } from '@/lib/partsApi';
import ModelCard from '@/app/parts/_components/ModelCard';
import type { CcClass, PartsModelListItem } from '@/types/parts';
import type { Metadata } from 'next';
import Link from 'next/link';

const CC_CLASS_LABELS: Record<CcClass, string> = {
  '50': '50cc',
  '100_165': '100cc – 165cc',
  '200_400': '200cc – 400cc',
  atv: 'ATV',
};
const CC_CLASS_ORDER: CcClass[] = ['50', '100_165', '200_400', 'atv'];

export const metadata: Metadata = {
  title: 'New Genuine SYM Parts | ScooterShop',
  description:
    'Order genuine new SYM scooter and motorcycle spare parts online. Browse by model and section, find the exact part from exploded diagrams, and check live availability.',
};

export const revalidate = 300;

export default async function Page() {
  const models = await getPartsModels();
  return <PartsLandingPage models={models} />;
}

function PartsLandingPage({ models }: { models: PartsModelListItem[] }) {
  const grouped = CC_CLASS_ORDER.map((cc) => ({
    cc,
    label: CC_CLASS_LABELS[cc],
    models: models.filter((model) => model.cc_class === cc),
  })).filter((group) => group.models.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-black">New SYM Parts</span>
      </nav>
      <h1 className="text-2xl font-bold text-black">New Genuine SYM Parts</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Choose your model, open the relevant section, and add the parts you need straight from the
        exploded diagram. Availability and pricing are shown per part.
      </p>

      {grouped.length === 0 && <p className="mt-8 text-gray-500">No models available yet. Please check back soon.</p>}

      {grouped.map((group) => (
        <section key={group.cc} className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-black">{group.label}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.models.map((model) => <ModelCard key={model.slug} model={model} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
