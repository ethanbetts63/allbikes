/** Canonical customer-facing paths for the genuine SYM parts catalogue. */
export const SYM_PARTS_PATH = '/parts/new/sym';

export function symPartsModelPath(modelSlug: string) {
  return `${SYM_PARTS_PATH}/${encodeURIComponent(modelSlug)}`;
}

export function symPartsSectionPath(modelSlug: string, sectionCode: string) {
  return `${symPartsModelPath(modelSlug)}/${encodeURIComponent(sectionCode)}`;
}
