import type { Bike } from '@/types';

export const generateBikeSlug = (bike: Bike): string => {
  const { year, make, model, id } = bike;
  // Sanitize make and model by replacing spaces with hyphens and removing other problematic characters.
  const sanitizedMake = make.toLowerCase().replace(/[\s\W]+/g, '-');
  const sanitizedModel = model.toLowerCase().replace(/[\s\W]+/g, '-');

  const slugParts = [
    year,
    sanitizedMake,
    sanitizedModel,
  ].filter(Boolean).join('-');
  
  return `${slugParts}-${id}`;
};