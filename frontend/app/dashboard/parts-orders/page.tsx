'use client';

import { useEffect, useState } from 'react';

import { adminGetPartsOrders } from '@/app/dashboard/parts-orders/_lib/partsAdminService';
import type { AdminPartsOrderListItem } from '@/app/dashboard/parts-orders/_lib/partsAdmin';
import { adminGetPartsSettings } from '@/app/dashboard/_lib/partsSettingsService';
import HowItWorks from './_components/HowItWorks';
import OrdersFilterBar from './_components/OrdersFilterBar';
import OrdersPagination from './_components/OrdersPagination';
import PartsOrdersTable from './_components/PartsOrdersTable';
import type { Sort, SortField } from './_lib/partsOrderStyles';

export default function PartsOrdersListPage() {
  const [orders, setOrders] = useState<AdminPartsOrderListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [status, setStatus] = useState('all');
  const [backorderOnly, setBackorderOnly] = useState(false);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort | null>(null); // null → backend "to-do first" default
  const [loading, setLoading] = useState(true);
  const [backorderDays, setBackorderDays] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGetPartsSettings()
      .then((settings) => {
        if (cancelled) return;
        if (typeof settings?.backorder_hold_days === 'number') {
          setBackorderDays(settings.backorder_hold_days);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminGetPartsOrders({
      status: status === 'all' ? undefined : status,
      has_backorder: backorderOnly,
      q: search || undefined,
      ordering: sort ? `${sort.dir === 'desc' ? '-' : ''}${sort.field}` : undefined,
      page,
    })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.results);
        setCount(res.count);
        setHasNext(res.next !== null);
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, backorderOnly, search, sort, page]);

  // Every filter change flips loading itself rather than the effect doing it,
  // which keeps setState out of the effect body.
  const refetchWith = (apply: () => void) => {
    setLoading(true);
    apply();
  };

  const changeStatus = (value: string) => refetchWith(() => { setStatus(value); setPage(1); });
  const changeBackorder = (only: boolean) => refetchWith(() => { setBackorderOnly(only); setPage(1); });
  const changePage = (next: number) => refetchWith(() => setPage(next));

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchWith(() => { setSearch(q.trim()); setPage(1); });
  };

  const toggleSort = (field: SortField) => refetchWith(() => {
    setPage(1);
    setSort((prev) => (prev?.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  });

  const clearFilters = () => refetchWith(() => {
    setStatus('all');
    setBackorderOnly(false);
    setQ('');
    setSearch('');
    setSort(null);
    setPage(1);
  });

  const activeFilters =
    (status !== 'all' ? 1 : 0) + (backorderOnly ? 1 : 0) + (search ? 1 : 0) + (sort ? 1 : 0);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-[var(--text-dark-primary)]">Parts Orders</h1>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <OrdersFilterBar
          count={count}
          status={status}
          backorderOnly={backorderOnly}
          query={q}
          activeFilters={activeFilters}
          onStatusChange={changeStatus}
          onBackorderChange={changeBackorder}
          onQueryChange={setQ}
          onSubmitSearch={submitSearch}
          onClearFilters={clearFilters}
        />

        <PartsOrdersTable
          orders={orders}
          loading={loading}
          sort={sort}
          activeFilters={activeFilters}
          onSort={toggleSort}
          onClearFilters={clearFilters}
        />

        <OrdersPagination
          page={page}
          count={count}
          hasNext={hasNext}
          loading={loading}
          onPageChange={changePage}
        />
      </section>

      {backorderDays !== null && <HowItWorks backorderDays={backorderDays} />}
    </div>
  );
}
