"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { FaqItem } from '@/types/FaqItem';
import type { OtherSite } from '@/types/OtherSite';

const FaqSection = dynamic(() => import('@/components/FaqSection').then((module) => module.FaqSection), {
  ssr: false,
});
const OtherSites = dynamic(() => import('@/components/OtherSites'), {
  ssr: false,
});

interface DeferredContactSectionsProps {
  faqData: FaqItem[];
  otherSites: OtherSite[];
}

const DeferredContactSections = ({ faqData, otherSites }: DeferredContactSectionsProps) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => setShouldRender(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(() => setShouldRender(true), 1200);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!shouldRender) return null;

  return (
    <>
      <FaqSection title="Frequently Asked Questions" faqData={faqData} />
      <OtherSites sites={otherSites} />
    </>
  );
};

export default DeferredContactSections;
