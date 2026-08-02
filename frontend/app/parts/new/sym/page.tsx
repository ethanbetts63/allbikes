import { getPartsModels } from '@/lib/partsApi';
import ModelCarousel from '@/app/parts/_components/ModelCarousel';
import ModelCarouselItem from '@/app/parts/_components/ModelCarouselItem';
import HowPartsLookupWorks from '@/app/parts/_components/HowPartsLookupWorks';
import Hero from '@/components/marketing/Hero';
import PayLaterSection from '@/components/marketing/PayLaterSection';
import SymImage from '@/assets/sym_22.webp';
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
  title: 'New SYM Parts Australia | ScooterShop',
  description:
    'Order genuine new SYM scooter and motorcycle spare parts online, shipped Australia-wide. Browse by model and section, find the exact part from exploded diagrams, download official service manuals, and compare parts and specs across SYM models.',
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
    <>
      <Hero
        title="New SYM Parts Australia"
        description="Find genuine SYM parts by model, diagram, part number, or 17-character VIN. We also provide official service manuals and let you compare parts and specifications across SYM models, with every order shipped Australia-wide."
        image={SymImage}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">New SYM Parts</span>
        </nav>
        <h2 className="text-2xl font-bold text-black">Browse by Engine Size</h2>

        {grouped.length === 0 && <p className="mt-8 text-gray-500">No models available yet. Please check back soon.</p>}

        <div className="mt-8 space-y-8">
          {grouped.map((group) => (
            <ModelCarousel
              key={group.cc}
              title={
                group.cc === 'atv' ? (
                  <>
                    Parts for <span className="text-[var(--highlight)]">SYM ATVs</span>
                  </>
                ) : (
                  <>
                    Parts for <span className="text-[var(--highlight)]">{group.label}</span> SYM scooters
                  </>
                )
              }
            >
              {group.models.map((model) => (
                <ModelCarouselItem key={model.slug} model={model} />
              ))}
            </ModelCarousel>
          ))}
        </div>

        <HowPartsLookupWorks />
      </div>

      {/* Full-bleed, outside the max-width container, as on the home page. */}
      <PayLaterSection />
    </>
  );
}
