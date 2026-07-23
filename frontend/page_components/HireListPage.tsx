import HireAvailabilitySection from '@/components/HireAvailabilitySection';
import HireConfidenceSection from '@/components/HireConfidenceSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { PublicHireSettings } from '@/types/PublicHireSettings';

interface HireListPageProps {
  initialBikes?: Bike[];
  hasHireFleet?: boolean;
  bargainBikes?: Bike[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialHireSettings?: PublicHireSettings | null;
  initialBlockedDates?: HireBlockedDate[];
}

const HireListPage = ({
  initialBikes,
  hasHireFleet = true,
  bargainBikes = [],
  initialStartDate,
  initialEndDate,
  initialHireSettings,
  initialBlockedDates = [],
}: HireListPageProps) => (
  <>
    <HireAvailabilitySection
      initialBikes={initialBikes}
      hasHireFleet={hasHireFleet}
      initialStartDate={initialStartDate}
      initialEndDate={initialEndDate}
      initialHireSettings={initialHireSettings}
      initialBlockedDates={initialBlockedDates}
      emptyState={(
        <section className="bg-[var(--card)] pt-10">
          <div className="container mx-auto px-4 pb-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-[var(--text-dark-primary)] leading-tight mb-3">
              Sorry, Our Hire Bikes Are Fully Booked Right Now.
            </h2>
            <p className="text-lg text-[var(--text-dark-secondary)]">
              You might be interested in one of these bargain deals below instead.
            </p>
          </div>
          <FeaturedBikes
            title="Bargain Bikes for Sale"
            bikes={bargainBikes}
            description="Eight of our cheapest new and used bikes currently available to buy."
            linkTo="/inventory/motorcycles/used"
            linkText="Browse Used Bikes"
          />
        </section>
      )}
    />

    <HireConfidenceSection
      weeklyDiscountPercent={initialHireSettings?.weekly_discount_percent ?? null}
      monthlyDiscountPercent={initialHireSettings?.monthly_discount_percent ?? null}
    />
  </>
);

export default HireListPage;
