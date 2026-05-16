import HireAvailabilitySection from '@/components/HireAvailabilitySection';
import HireConfidenceSection from '@/components/HireConfidenceSection';
import type { Bike } from '@/types/Bike';
import type { HireBlockedDate } from '@/types/HireBlockedDate';
import type { PublicHireSettings } from '@/types/PublicHireSettings';

interface HireListPageProps {
  initialBikes?: Bike[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialHireSettings?: PublicHireSettings | null;
  initialBlockedDates?: HireBlockedDate[];
}

const HireListPage = ({
  initialBikes,
  initialStartDate,
  initialEndDate,
  initialHireSettings,
  initialBlockedDates = [],
}: HireListPageProps) => (
  <>
    <HireAvailabilitySection
      initialBikes={initialBikes}
      initialStartDate={initialStartDate}
      initialEndDate={initialEndDate}
      initialHireSettings={initialHireSettings}
      initialBlockedDates={initialBlockedDates}
    />

    <HireConfidenceSection
      weeklyDiscountPercent={initialHireSettings?.weekly_discount_percent ?? null}
      monthlyDiscountPercent={initialHireSettings?.monthly_discount_percent ?? null}
    />
  </>
);

export default HireListPage;
