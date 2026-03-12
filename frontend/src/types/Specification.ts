import type React from 'react';

export interface Specification {
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  formatter?: (val: any) => string;
}
