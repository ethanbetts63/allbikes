import { permanentRedirect } from 'next/navigation';
import { SYM_PARTS_PATH } from '@/app/parts/_lib/routes';

/** The current catalogue is new genuine SYM parts. */
export default function Page() {
  permanentRedirect(SYM_PARTS_PATH);
}
