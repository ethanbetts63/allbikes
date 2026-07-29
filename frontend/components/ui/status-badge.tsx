import { Badge } from '@/components/ui/badge';

const FALLBACK = 'text-[var(--text-dark-secondary)] border-gray-400';

/**
 * Outline badge coloured from a per-domain status map.
 *
 * The maps stay with their own section — hire statuses and parts statuses are
 * unrelated vocabularies — but the rendering is shared so they can't drift.
 */
export default function StatusBadge({ status, map, label, className = '' }: {
  status: string;
  map: Record<string, string>;
  /** Defaults to the status with underscores replaced. */
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={`${map[status] ?? FALLBACK} ${className}`.trim()}>
      {label ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}
