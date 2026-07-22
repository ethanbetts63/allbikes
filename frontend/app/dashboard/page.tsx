import { redirect } from 'next/navigation';

// The admin index has no content of its own — the old dashboard is now the
// Notifications page. Kept as a redirect so existing links and the post-login
// landing still work.
export default function Page() {
  redirect('/dashboard/notifications');
}
