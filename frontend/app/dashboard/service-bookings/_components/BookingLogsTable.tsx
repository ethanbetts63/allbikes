import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { formatDate } from '@/lib/formatting';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/ui/status-badge';
import { STATUS_BADGE } from '../_lib/bookingLogStatus';

/** Submitted booking requests and whether they reached MechanicDesk. */
export default function BookingLogsTable({ logs, onDelete }: {
  logs: BookingRequestLog[];
  onDelete: (e: React.MouseEvent, id: number) => void;
}) {
  const router = useRouter();
  return (
    <div className="rounded-md border border-border-light overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-light">
            <TableHead className="text-[var(--text-dark-primary)]">Customer</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Vehicle Reg</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
            <TableHead className="text-[var(--text-dark-primary)]">Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length ? (
            logs.map(log => (
              <TableRow
                key={log.id}
                className="border-border-light cursor-pointer hover:bg-[var(--bg-light-secondary)]"
                onClick={() => router.push(`/dashboard/service-bookings/${log.id}`)}
              >
                <TableCell className="text-[var(--text-dark-primary)]">
                  <div className="font-medium">{log.customer_name}</div>
                  <div className="text-[var(--text-dark-secondary)] text-xs">{log.customer_email}</div>
                </TableCell>
                <TableCell className="text-[var(--text-dark-primary)] text-sm font-mono">
                  {log.vehicle_registration ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.status} map={STATUS_BADGE} label={log.status} />
                </TableCell>
                <TableCell className="text-[var(--text-dark-primary)] text-sm">
                  {formatDate(log.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => onDelete(e, log.id)}
                    className="text-destructive hover:text-destructive hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-[var(--text-dark-primary)]">
                No booking logs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
