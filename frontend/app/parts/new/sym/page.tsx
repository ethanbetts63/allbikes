import { getPartsModels } from '@/lib/partsApi';
import ModelCarousel from '@/app/parts/_components/ModelCarousel';
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
    <>
      <Hero
        title="New Genuine SYM Parts"
        description="Find genuine SYM parts by model, diagram, part number, or 17-character VIN."
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
            <ModelCarousel key={group.cc} title={group.label} models={group.models} />
          ))}
        </div>

        <section className="mt-12 border-y border-gray-200 py-10" aria-labelledby="how-it-works">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Buy with confidence</p>
            <h2 id="how-it-works" className="mt-2 text-2xl font-bold text-black">
              How SYM parts lookup works
            </h2>
            <p className="mt-2 text-gray-600">
              A few simple checks help you find the right genuine part before you order.
            </p>
          </div>

          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                1
              </span>
              <h3 className="mt-4 font-semibold text-black">Choose the Correct Model Code</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                This can be difficult. We recommend searching by VIN, paying attention to if your part is available across all potentially correct model codes, and contacting us if you are unsure. 
              </p>
            </li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                2
              </span>
              <h3 className="mt-4 font-semibold text-black">Select the desired diagram</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Each models page will display a list of all section diagrams. It will also show if any section is an exact match a part section on another model.
              </p>
            </li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                3
              </span>
              <h3 className="mt-4 font-semibold text-black">Select Your Parts</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Each numbered part will correspond to a number in the diagram. Parts will almost always display if their stock is low or out. Colored options will display as a drop down on colored parts. 
              </p>
            </li>
          </ol>

          <p className="mt-5 text-sm text-gray-500">
            Shared listings mean the same part number appears in another book; always confirm your model
            code before ordering.
          </p>
        </section>
      </div>

      {/* Full-bleed, outside the max-width container, as on the home page. */}
      <PayLaterSection />
    </>
  );
}
