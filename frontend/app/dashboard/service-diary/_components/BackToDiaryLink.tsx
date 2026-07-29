import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { DIARY_PATH } from '../_lib/diary';

/** Shared back link for the add and edit booking screens. */
export default function BackToDiaryLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(DIARY_PATH)}
      className="flex items-center gap-1 text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] mb-4"
    >
      <ArrowLeft className="h-4 w-4" /> Back to diary
    </button>
  );
}
