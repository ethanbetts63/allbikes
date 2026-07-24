export type CcClass = '50' | '100_165' | '200_400' | 'atv';

export interface PartsModelListItem {
  name: string;
  model_code: string;
  cc_class: CcClass;
  slug: string;
}

export interface PartSectionSummary {
  id: number;
  code: string;
  group: 'engine' | 'frame';
  name: string;
  sort_order: number;
  diagram_thumb: string | null;
}

export interface PartsModelDetail extends PartsModelListItem {
  sections: PartSectionSummary[];
}

export type VariantAxis = 'colour' | 'date' | 'none';

export interface PartVariant {
  part_number: string;
  description: string;
  colour_name: string | null;
  paint_code: string | null;
  effective_date: string | null;
  variant_label: string;
  quantity: number;
  price: string | null;
  available_qty: number | null;
  backorder: boolean;
  orderable: boolean;
}

export interface Callout {
  ref_number: string;
  callout_label: string;
  variant_axis: VariantAxis;
  variants: PartVariant[];
}

export interface SectionDetail {
  id: number;
  code: string;
  group: 'engine' | 'frame';
  name: string;
  model: { name: string; model_code: string; slug: string };
  diagram_image: string | null;
  callouts: Callout[];
}

export interface SearchSectionRef {
  section_id: number;
  section_code: string;
  section_name: string;
  model_slug: string;
  model_name: string;
  ref_number: string;
}

export interface SearchPartResult {
  part_number: string;
  description: string;
  colour_name: string | null;
  price: string | null;
  orderable: boolean;
  sections: SearchSectionRef[];
}

export interface PartsSearchResults {
  query: string;
  parts: SearchPartResult[];
  models: PartsModelListItem[];
}

/** A line item in the parts cart (persisted in localStorage). */
export interface PartsCartItem {
  part_number: string;
  description: string;
  colour_name: string | null;
  model_name: string;
  model_code: string;
  section_code: string;
  ref_number: string;
  unit_price: string;
  quantity: number;
  backorder: boolean;
}
