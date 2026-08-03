/** Canonical customer-facing paths for the genuine SYM parts catalogue. */
export const SYM_PARTS_PATH = '/parts/new/sym';

export function symPartsModelPath(modelSlug: string) {
  return `${SYM_PARTS_PATH}/${encodeURIComponent(modelSlug)}`;
}

/**
 * Section codes (e.g. "E01", "F14") never contain a hyphen, so the code is
 * always recoverable by splitting the slug on the first "-" — see
 * `parseSectionSlug`. Everything after it is decorative, for search engines
 * and humans, and is never read back.
 */
export function symPartsSectionPath(modelSlug: string, sectionCode: string, sectionName: string) {
  const slug = `${sectionCode.toLowerCase()}-${slugify(sectionName)}`.replace(/-+$/, '');
  return `${symPartsModelPath(modelSlug)}/${encodeURIComponent(slug)}`;
}

/** Recovers the section code from a `{code}-{name-slug}` URL segment. */
export function parseSectionSlug(sectionSlug: string): string {
  return sectionSlug.split('-')[0];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
