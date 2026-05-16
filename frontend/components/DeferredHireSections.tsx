"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { FaqItem } from '@/types/FaqItem';

const PayLaterSection = dynamic(() => import('@/components/PayLaterSection'), {
  ssr: false,
});
const HireAreasSection = dynamic(() => import('@/components/HireAreasSection'), {
  ssr: false,
});
const FaqSection = dynamic(() => import('@/components/FaqSection').then((module) => module.FaqSection), {
  ssr: false,
});

interface DeferredHireSectionsProps {
  faqData: FaqItem[];
}

const DeferredHireSections = ({ faqData }: DeferredHireSectionsProps) => {
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
      <PayLaterSection />
      <HireAreasSection />
      <FaqSection title="Hire FAQs" faqData={faqData} />
    </>
  );
};

export default DeferredHireSections;
