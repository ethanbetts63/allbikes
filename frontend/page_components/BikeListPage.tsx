import BikeCard from '@/components/BikeCard';
import type { BreadcrumbItem } from '@/types/BreadcrumbItem';
import type { BikeListPageProps } from '@/types/BikeListPageProps';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import Hero from '@/components/Hero';
import SymImage from '@/assets/sym_22.webp';
import BikeFilterForm from '@/components/BikeFilterForm';
import { FaqSection } from '@/components/FaqSection';
import StructuredDataScript from '@/components/StructuredDataScript';
import { buildFaqSchema } from '@/lib/seo';
import { buildListHref } from '@/lib/listQuery';

const newBikeFaqs = [
  {
    question: 'What new motorcycles and scooters do you sell?',
    answer: 'We sell brand-new SYM scooters and Segway electric scooters or electric motorcycles. These are the only brands we offer new, so we can confidently stand behind their quality and reliability.'
  },
  {
    question: 'Is your dealership in Perth?',
    answer: 'Yes. Our motorcycle and scooter dealership and showroom are in Perth, where you can view and buy new SYM or Segway models in person.'
  },
  {
    question: 'Do you sell electric scooters or electric motorcycles?',
    answer: 'Yes. We sell electric scooters and electric motorcycles, including the Segway range, for commuting and everyday riding in Perth.'
  },
  {
    question: 'Do you have a showroom for new vehicles?',
    answer: 'Yes. We operate a scooter and motorcycle showroom in Perth, displaying current new SYM and Segway inventory for direct purchase.'
  }
];

const usedMotorcycleFaqs = [
  {
    question: 'What used motorcycles do you sell?',
    answer: 'We sell quality used motorcycles across a range of brands, depending on what passes our workshop standards. Each pre-owned motorcycle is selected for condition, reliability, and overall value.'
  },
  {
    question: 'Are used motorcycles inspected before sale?',
    answer: 'Yes. Used motorcycles are inspected and prepared by our Dianella workshop before being listed for sale, so buyers can inspect and purchase with confidence.'
  },
  {
    question: 'Can I view used motorcycles at your Perth dealership?',
    answer: 'Yes. Used motorcycles can be viewed at our Dianella dealership unless a listing specifically states otherwise. Contact us first if you want to confirm availability before visiting.'
  },
  {
    question: 'Do you sell learner-approved used motorcycles?',
    answer: 'When available, learner-approved motorcycles are marked on their listing. Availability changes with current stock, so check the individual motorcycle details.'
  },
  {
    question: 'Do used motorcycles come with registration or warranty?',
    answer: 'Registration and warranty details vary by motorcycle. Check the individual listing or contact the workshop for the current details on a specific used bike.'
  }
];

const usedScooterFaqs = [
  {
    question: 'What used scooters do you sell?',
    answer: 'We sell used and second-hand scooters when suitable stock is available, including brands such as Vespa, Piaggio, SYM, and other scooter models that meet our condition standards.'
  },
  {
    question: 'Do you sell used Vespa or Piaggio scooters?',
    answer: 'Yes. Used Vespa and Piaggio scooters are listed when they are available and meet our standards for quality, reliability, and value.'
  },
  {
    question: 'Are used scooters inspected before sale?',
    answer: 'Yes. Used scooters are inspected and prepared by our Dianella workshop before being listed for sale.'
  },
  {
    question: 'Can I ride a used scooter on a car licence in WA?',
    answer: 'You can ride anything up to 50cc on a car licence in Western Australia, so all used scooters we sell that are 50cc or under can be ridden on a car licence. Check the individual scooter listing for its engine size and details.'
  },
  {
    question: 'Can I view used scooters in Perth?',
    answer: 'Yes. Used scooters can be viewed at our Dianella showroom unless the listing states otherwise. Contact us first if you want to confirm a specific scooter is still available.'
  }
];

const partsBikeFaqs = [
  {
    question: 'What is the Workshop Clearance?',
    answer: "Running a busy workshop means we accumulate bikes over time: bikes that are not worth our time to fully restore, or donor bikes we have stripped for parts. Rather than let them gather dust, we list them here so enthusiasts, tinkerers, and mechanics can give them a second life."
  },
  {
    question: 'Are these bikes roadworthy?',
    answer: 'Almost certainly not. These bikes are sold as-is, primarily for parts or as project bikes. They are not workshop-prepared or safety checked for road use. Please inspect carefully before purchasing.'
  },
  {
    question: 'Can I come in and inspect a parts bike?',
    answer: 'Yes. You are welcome to come into our Perth workshop to take a look before buying. Give us a call or send us an email to arrange a time.'
  },
  {
    question: 'Do you deliver parts bikes?',
    answer: 'We do not deliver bikes directly, but we partner with a motorcycle mover who can transport around Perth.'
  },
];

const BikeListPage = ({ bikeCondition, pageType, bikes, totalPages, currentPage, filters }: BikeListPageProps) => {
  const isNew = bikeCondition === 'new,demo';
  const isParts = bikeCondition === 'parts';
  const resolvedPageType = pageType ?? (isNew ? 'new' : isParts ? 'parts' : 'used-motorcycles');
  const isUsedScooters = resolvedPageType === 'used-scooters';
  const isUsedMotorcycles = resolvedPageType === 'used-motorcycles';

  const pageTitle = isNew
    ? 'New Motorcycles & Scooters'
    : isParts
      ? 'Workshop Clearance'
      : isUsedScooters
        ? 'Used Scooters'
        : 'Used Motorcycles';

  const responsivePageTitle = isNew ? (
    <>
      <span className="hidden md:inline">New Motorcycles & Scooters</span>
      <span className="md:hidden">New Bikes</span>
    </>
  ) : isParts ? 'Workshop Clearance' : (
    <>
      <span className="hidden md:inline">{pageTitle}</span>
      <span className="md:hidden">{isUsedScooters ? 'Used Scooters' : 'Used Bikes'}</span>
    </>
  );

  const description = isNew
    ? 'Browse our range of new motorcycles and scooters available in Perth, including petrol and electric models. All new motorcycles and scooters are workshop-prepared and available for local purchase through our Perth dealership.'
    : isParts
      ? 'Running a busy workshop means we accumulate bikes over time: bikes that are not worth our time to fully restore, or donor bikes we have stripped for parts. Rather than let them gather dust, we list them here so enthusiasts, tinkerers, and mechanics can give them a second life.'
      : isUsedScooters
        ? 'Browse our range of used scooters for sale in Perth, including pre-owned mopeds and scooters prepared by our Dianella workshop when suitable stock is available.'
        : 'Browse our range of used motorcycles for sale in Perth. Each pre-owned motorcycle is workshop-prepared and available for local purchase through our Dianella dealership.';

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    {
      name: pageTitle,
      href: isNew
        ? '/inventory/motorcycles/new'
        : isParts
          ? '/inventory/motorcycles/parts'
          : isUsedScooters
            ? '/inventory/scooters/used'
            : '/inventory/motorcycles/used'
    }
  ];
  const basePath = breadcrumbItems[1].href;

  const faqData = isNew
    ? newBikeFaqs
    : isParts
      ? partsBikeFaqs
      : isUsedScooters
        ? usedScooterFaqs
        : usedMotorcycleFaqs;

  return (
    <>
      <StructuredDataScript structuredData={buildFaqSchema(faqData) ?? undefined} />
      <Hero
        title={responsivePageTitle}
        description={description}
        imageUrl={SymImage.src}
      />
      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <BikeFilterForm basePath={basePath} filters={filters} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.length > 0 ? (
              bikes.map((bike, i) => (
                <BikeCard key={bike.id} bike={bike} priority={i === 0} />
              ))
            ) : (
              <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">
                No bikes found for this category. Sorry, we must have sold out. We will update this page as soon as possible.
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildListHref(basePath, filters, Math.max(currentPage - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="p-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={buildListHref(basePath, filters, Math.min(currentPage + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
      <FaqSection
        title={isNew ? 'New Bike FAQs' : isParts ? 'Workshop Clearance FAQs' : isUsedMotorcycles ? 'Used Motorcycle FAQs' : 'Used Scooter FAQs'}
        faqData={faqData}
      />
    </>
  );
};

export default BikeListPage;
