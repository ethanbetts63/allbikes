'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import clickIcon from '@/assets/click.svg';

interface NewScooterColourPurchaseProps {
  slug: string;
  availableColours: string[];
  depositAmount: string | null;
  canPurchase: boolean;
}

export default function NewScooterColourPurchase({
  slug,
  availableColours,
  depositAmount,
  canPurchase,
}: NewScooterColourPurchaseProps) {
  const [selectedColour, setSelectedColour] = useState(
    availableColours.length === 1 ? availableColours[0] : ''
  );

  const hasColourChoices = availableColours.length > 0;
  const checkoutHref = selectedColour
    ? {
        pathname: `/checkout/${slug}`,
        query: { type: 'deposit', colour: selectedColour },
      }
    : `/checkout/${slug}?type=deposit`;

  return (
    <>
      {hasColourChoices && (
        <div className="mb-6">
          <label
            htmlFor="scooter-colour"
            className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]"
          >
            Choose a Colour
          </label>
          <select
            id="scooter-colour"
            value={selectedColour}
            onChange={(event) => setSelectedColour(event.target.value)}
            className="h-11 w-full rounded-md border border-border-light bg-[var(--bg-light-primary)] px-3 text-sm text-[var(--text-dark-primary)] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {availableColours.length > 1 && <option value="">Select a colour</option>}
            {availableColours.map((colour) => (
              <option key={colour} value={colour}>{colour}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--text-dark-secondary)]">
            Available finishes are shown in the image gallery.
          </p>
        </div>
      )}

      {canPurchase && depositAmount && (
        <div className="mb-6">
          {hasColourChoices && !selectedColour ? (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-3 bg-highlight px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--text-dark-primary)] opacity-50"
            >
              <Image src={clickIcon} alt="" width={28} height={28} className="opacity-70" />
              Select a Colour to Reserve
            </button>
          ) : (
            <Link
              href={checkoutHref}
              className="flex w-full items-center justify-center gap-3 bg-highlight px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--text-dark-primary)] transition-colors hover:bg-highlight/80"
            >
              <Image src={clickIcon} alt="" width={28} height={28} className="opacity-70" />
              Reserve Now - Deposit ${parseFloat(depositAmount).toLocaleString()}
            </Link>
          )}
          <p className="mt-2 text-center text-xs text-[var(--text-dark-secondary)]">
            {`Secure your place with a $${parseFloat(depositAmount).toLocaleString()} deposit — we'll be in touch to arrange the rest.`}
          </p>
        </div>
      )}
    </>
  );
}
