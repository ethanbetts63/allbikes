import { permanentRedirect } from 'next/navigation';

/** The current catalogue is new genuine SYM parts. */
export default function Page() {
  permanentRedirect('/parts/new/sym');
}
