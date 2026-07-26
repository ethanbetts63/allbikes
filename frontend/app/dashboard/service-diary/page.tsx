import { Suspense } from 'react';
import AdminServiceDiaryPage from './AdminServiceDiaryPage';

// The diary reads its week from ?week=, so useSearchParams needs a Suspense
// boundary above it or the production build fails.
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--text-dark-secondary)]">Loading diary…</div>}>
      <AdminServiceDiaryPage />
    </Suspense>
  );
}
