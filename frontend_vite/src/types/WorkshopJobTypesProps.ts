import type { EnrichedJobType } from './EnrichedJobType';

export interface WorkshopJobTypesProps {
  jobTypes: EnrichedJobType[];
  isLoading: boolean;
  error?: string | null;
  title: string;
  paragraph: string;
  buttonText: string;
}
