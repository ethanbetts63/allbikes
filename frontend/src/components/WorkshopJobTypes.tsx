import React from 'react';
import { Link } from 'react-router-dom';
import type { EnrichedJobType } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cog } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner";

interface WorkshopJobTypesProps {
  jobTypes: EnrichedJobType[];
  isLoading: boolean;
}

const SkeletonLoader = () => (
    <div className="bg-foreground p-6 rounded-lg shadow-md flex items-center justify-center h-[120px]">
        <Spinner />
    </div>
);

const WorkshopJobTypes: React.FC<WorkshopJobTypesProps> = ({ jobTypes, isLoading }) => {
  return (
    <div className="w-full flex flex-col md:flex-row bg-background text-[var(--text-primary)] rounded-lg overflow-hidden">
      {/* Left Column */}
      <div className="md:w-1/2 flex flex-col items-start justify-center p-8 md:p-12">
        <h2 className="text-4xl font-extrabold mb-6 leading-tight">
          Book Your Service
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-prose mb-10">
          Ready to get your motorcycle or scooter in top shape? Our expert mechanics are here to help. From routine maintenance to complex repairs, we've got you covered. Use our online booking system to find a time that works for you.
        </p>
        <Link to="/booking">
          <Button className="bg-primary text-[var(--text-primary)] font-bold px-8 py-5 text-xl hover:bg-primary/90 flex items-center gap-2">
            Book Online Now <ArrowRight className="h-5" />
          </Button>
        </Link>
      </div>

      {/* Right Column */}
      <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <>
              <SkeletonLoader />
              <SkeletonLoader />
            </>
          ) : !jobTypes || jobTypes.length === 0 ? (
            <div className="bg-foreground p-6 rounded-lg flex items-center gap-4">
                <Cog className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                    <h3 className="text-xl font-bold mb-2">No Services Currently Listed</h3>
                    <p className="text-[var(--text-secondary)]">
                        Please check back again later or contact us directly for booking inquiries.
                    </p>
                </div>
            </div>
          ) : (
            jobTypes.map((job) => (
              <div key={job.name} className="bg-foreground p-6 rounded-lg shadow-md flex items-center gap-4">
                <Cog className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                    <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{job.name}</h3>
                    <p className="text-[var(--text-secondary)]">
                      {job.description || 'Detailed description coming soon.'}
                    </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopJobTypes;
