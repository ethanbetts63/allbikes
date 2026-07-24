import PartsShell from '@/page_components/parts/PartsShell';

export default function PartsLayout({ children }: { children: React.ReactNode }) {
  return <PartsShell>{children}</PartsShell>;
}
