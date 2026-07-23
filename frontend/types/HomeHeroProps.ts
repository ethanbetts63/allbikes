import type { Bike } from './Bike';

export interface HomeHeroPanelConfig {
  eyebrow: string;
  titleLines: string[];
  mobileTitleLines?: string[];
  href: string;
  linkText: string;
  alt: string;
  fallbackImage: string;
  prependImage?: string;
  imageFit?: 'contain' | 'cover';
}

export interface HomeHeroServiceConfig {
  eyebrow: string;
  heading: string;
  description: string;
  href: string;
  linkText: string;
}

export interface HomeHeroProps {
  newBikes: Bike[];
  usedBikes: Bike[];
  error: string | null;
  phoneNumber?: string;
  mobileNumber?: string;
  emailAddress?: string;
  layout?: 'dual' | 'single';
  eyebrow?: string;
  headingLines?: string[];
  description?: string;
  newPanel?: HomeHeroPanelConfig;
  usedPanel?: HomeHeroPanelConfig;
  servicePanel?: HomeHeroServiceConfig | false;
}
