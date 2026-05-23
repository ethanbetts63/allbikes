interface ArticlePageMeta {
  title: string;
  description: string;
}

const metaBySlug: Record<string, ArticlePageMeta> = {
  'buying-used-scooter-perth': {
    title: 'Buying a Used Scooter in Perth 2026',
    description:
      'What to check before buying a second-hand scooter in Perth — brand selection, physical inspection, PPSR checks, and what to avoid in the private market.',
  },
  'car-vs-scooter-perth-commuter-guide': {
    title: 'Car vs Scooter in Perth: The Real Costs 2026',
    description:
      'The real annual cost of commuting by car versus petrol scooter, electric moped, or motorcycle in Perth — parking, fuel, and licence requirements compared.',
  },
  'wa-e-scooter-laws-2026': {
    title: 'E-Scooter Laws in WA 2026',
    description:
      "What's legal for e-scooter riders in WA — speed limits, where you can ride, helmet rules, and what changed after the 2025 parliamentary inquiry.",
  },
  'wa-scooter-motorcycle-licence-guide': {
    title: 'WA Scooter & Motorcycle Licence Guide 2026',
    description:
      'Which licence you need to ride a scooter or motorcycle in WA — from 50cc on a car licence to the full R class, explained step by step.',
  },
};

export function getArticlePageMeta(slug: string): ArticlePageMeta | null {
  return metaBySlug[slug] ?? null;
}
