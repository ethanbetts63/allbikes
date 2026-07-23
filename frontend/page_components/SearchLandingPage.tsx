import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import HomeHeroV2 from '@/components/HomeHeroV2';
import PayLaterSection from '@/components/PayLaterSection';
import ReviewCarousel, { type Review } from '@/components/ReviewCarousel';
import ServiceCTAV2, { type ServiceCTAV2Props } from '@/components/ServiceCTAV2';
import StructuredDataScript from '@/components/StructuredDataScript';
import type { Bike } from '@/types/Bike';
import type { BrandProps } from '@/types/BrandProps';
import type { FaqItem } from '@/types/FaqItem';
import type { FeaturedBikesProps } from '@/types/FeaturedBikesProps';
import type { HomeHeroProps } from '@/types/HomeHeroProps';

interface SearchLandingPageProps {
  structuredData: object[];
  hero: HomeHeroProps;
  reviews?: Review[];
  newCarousel: Omit<FeaturedBikesProps, 'bikes'> & { bikes: Bike[] };
  usedCarousel: Omit<FeaturedBikesProps, 'bikes'> & { bikes: Bike[] };
  service: ServiceCTAV2Props;
  storyCards: BrandProps[];
  faqTitle: string;
  faqData: FaqItem[];
  floatingServiceHref: string;
}

export default function SearchLandingPage({
  structuredData,
  hero,
  reviews,
  newCarousel,
  usedCarousel,
  service,
  storyCards,
  faqTitle,
  faqData,
  floatingServiceHref,
}: SearchLandingPageProps) {
  return (
    <div>
      <StructuredDataScript structuredData={structuredData} />
      <HomeHeroV2 {...hero} />
      <ReviewCarousel reviews={reviews} />

      <div className="defer-section-sm">
        <FeaturedBikes {...newCarousel} />
      </div>

      <div className="defer-section">
        <ServiceCTAV2 {...service} />
      </div>

      <div className="defer-section-sm">
        <FeaturedBikes {...usedCarousel} />
      </div>

      <div className="defer-section">
        <PayLaterSection />
      </div>

      <div className="defer-section-lg">
        <BrandsSection cards={storyCards} />
      </div>

      <div className="defer-section">
        <FaqSection title={faqTitle} faqData={faqData} />
      </div>

      <FloatingActionButton href={floatingServiceHref} />
    </div>
  );
}
