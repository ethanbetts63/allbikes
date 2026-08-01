import Link from 'next/link';

/** Guidance shown after browsing SYM models or individual exploded diagrams. */
export default function HowPartsLookupWorks() {
  return (
    <section className="mt-12 border-y border-gray-200 py-10" aria-labelledby="how-it-works">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--highlight)]">Buy with confidence</p>
        <h2 id="how-it-works" className="mt-2 text-2xl font-bold text-black">
          How SYM parts lookup works
        </h2>
        <div className="mt-3 h-1 w-12 rounded-full bg-[var(--highlight)]" aria-hidden="true" />
        <p className="mt-3 text-gray-600">
          A few simple checks help you find the right genuine part before you order.
        </p>
      </div>

      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--highlight)] text-xs font-bold text-[var(--bg-dark-primary)]">
            1
          </span>
          <h3 className="mt-4 font-semibold text-black">Choose the Correct Model Code</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            This can be difficult. We recommend searching by VIN, checking whether your part is
            available across all potentially correct model codes, and{' '}
            <Link
              href="/contact"
              className="font-medium text-[var(--highlight)] underline underline-offset-2 hover:text-black"
            >
              contacting us
            </Link>{' '}
            if you are unsure.
          </p>
        </li>
        <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--highlight)] text-xs font-bold text-[var(--bg-dark-primary)]">
            2
          </span>
          <h3 className="mt-4 font-semibold text-black">Select the desired diagram</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Each model page displays all section diagrams. It also shows when a section is an exact
            match for a part section on another model.
          </p>
        </li>
        <li className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--highlight)] text-xs font-bold text-[var(--bg-dark-primary)]">
            3
          </span>
          <h3 className="mt-4 font-semibold text-black">Select Your Parts</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Each numbered part corresponds to a number in the diagram. Parts almost always show when
            stock is low or out, and coloured parts display their options in a dropdown.
          </p>
        </li>
      </ol>
    </section>
  );
}
