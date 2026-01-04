import React from 'react';
import type { EnrichedJobType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkshopJobTypesProps {
  jobTypes: EnrichedJobType[];
}

const WorkshopJobTypes: React.FC<WorkshopJobTypesProps> = ({ jobTypes }) => {
  if (!jobTypes || jobTypes.length === 0) {
    return <p>No job types available at the moment.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobTypes.map((job) => (
            <Card key={job.name}>
              <CardHeader>
                <CardTitle>{job.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{job.description || 'Description not available.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkshopJobTypes;
