"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Pencil, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { deleteMotorcycle, getBikes } from "@/lib/api";
import type { Bike } from "@/types/Bike";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 20;
const conditionValues = ["new", "used", "demo", "parts"] as const;
const vehicleTypeValues = ["motorcycle", "scooter"] as const;
const statusValues = ["for_sale", "available_soon", "reserved", "sold", "unavailable"] as const;
const sortFields = ["date_posted", "make", "price"] as const;
type SortField = (typeof sortFields)[number];

const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
const money = (value: string | null | undefined) => value ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(Number(value)) : "—";
const number = (value: number | null | undefined, suffix = "") => value === null || value === undefined ? "—" : `${new Intl.NumberFormat("en-AU").format(value)}${suffix}`;

const statusClass: Record<Bike["status"], string> = {
  for_sale: "border-emerald-200 bg-emerald-50 text-emerald-800",
  available_soon: "border-sky-200 bg-sky-50 text-sky-800",
  reserved: "border-amber-200 bg-amber-50 text-amber-800",
  sold: "border-slate-200 bg-slate-100 text-slate-600",
  unavailable: "border-rose-200 bg-rose-50 text-rose-800",
};

function queryValue(params: URLSearchParams, key: string, allowed?: readonly string[]) {
  const value = params.get(key) ?? "";
  return !allowed || allowed.includes(value) ? value : "";
}

function SortHeader({ field, children, align = "left", sort, direction, onSort }: { field: SortField; children: React.ReactNode; align?: "left" | "right"; sort: SortField; direction: "asc" | "desc"; onSort: (field: SortField) => void }) {
  return (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button onClick={() => onSort(field)} className={`inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-950 ${align === "right" ? "justify-end" : ""}`}>
        {children}
        {sort === field ? direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </TableHead>
  );
}

export default function InventoryTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const [data, setData] = useState<Bike[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const condition = queryValue(params, "condition", conditionValues);
  const vehicleType = queryValue(params, "vehicle_type", vehicleTypeValues);
  const status = queryValue(params, "status", statusValues);
  const hire = params.get("hire") === "true";
  const search = params.get("search") ?? "";
  const [searchDraft, setSearchDraft] = useState(search);
  const sort = queryValue(params, "sort", sortFields) as SortField || "date_posted";
  const direction = params.get("direction") === "asc" ? "asc" : "desc";
  const requestedPage = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const setQuery = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(query);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    const text = next.toString();
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
  }, [pathname, query, router]);

  useEffect(() => {
    let active = true;
    getBikes({
      condition: condition as Bike["condition"] || undefined,
      vehicle_type: vehicleType as Bike["vehicle_type"] || undefined,
      status: status as Bike["status"] || undefined,
      is_hire: hire || undefined,
      search: search || undefined,
      ordering: `${sort}_${direction}`,
      page,
      page_size: PAGE_SIZE,
    }).then(response => {
      if (!active) return;
      setData(response.results);
      setTotal(response.count);
    }).catch(() => {
      if (active) setNotification({ message: "Could not load inventory. Please try again.", type: "error" });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [condition, direction, hire, page, params, refreshKey, search, sort, status, vehicleType]);

  const updateFilter = (key: string, value: string) => setQuery({ [key]: value || null, page: null });
  const toggleSort = (field: SortField) => setQuery({ sort: field, direction: sort === field && direction === "asc" ? "desc" : "asc", page: null });
  const clearFilters = () => {
    setSearchDraft("");
    router.replace(pathname, { scroll: false });
  };
  const activeFilters = [condition, vehicleType, status, hire ? "hire" : "", search].filter(Boolean).length;

  const removeBike = async (bike: Bike) => {
    if (!window.confirm(`Delete ${bike.year ?? ""} ${bike.make} ${bike.model}? This cannot be undone.`)) return;
    try {
      await deleteMotorcycle(bike.id);
      setNotification({ message: "Inventory item deleted.", type: "success" });
      setRefreshKey(value => value + 1);
    } catch {
      setNotification({ message: "Could not delete the inventory item.", type: "error" });
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><SlidersHorizontal className="h-4 w-4" /> Inventory filters</div>
            <p className="mt-1 text-sm text-slate-500">{total.toLocaleString("en-AU")} {total === 1 ? "item" : "items"} matching this view</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-600"><X className="mr-1 h-3.5 w-3.5" /> Clear filters</Button>}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={hire ? "hire" : condition || "all"} onValueChange={value => value === "hire" ? setQuery({ condition: null, hire: "true", page: null }) : setQuery({ condition: value === "all" ? null : value, hire: null, page: null })}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All conditions" /></SelectTrigger><SelectContent><SelectItem value="all">All conditions</SelectItem>{conditionValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}<SelectItem value="hire">Hire fleet</SelectItem></SelectContent></Select>
          <Select value={vehicleType || "all"} onValueChange={value => updateFilter("vehicle_type", value === "all" ? "" : value)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All vehicle types" /></SelectTrigger><SelectContent><SelectItem value="all">All vehicle types</SelectItem>{vehicleTypeValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent></Select>
          <Select value={status || "all"} onValueChange={value => updateFilter("status", value === "all" ? "" : value)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All sale statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All sale statuses</SelectItem>{statusValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent></Select>
          <form className="sm:col-span-2 lg:col-span-3" onSubmit={event => { event.preventDefault(); setQuery({ search: searchDraft.trim() || null, page: null }); }}><div className="flex gap-2"><Input name="search" type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="Search make, model, stock number, rego or VIN" aria-label="Search inventory" className="bg-white" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div>{search && <p className="mt-2 text-xs text-slate-500">Showing results for <span className="font-medium text-slate-700">“{search}”</span>.</p>}</form>
        </div>
      </div>

      {notification && <Alert variant={notification.type === "error" ? "destructive" : "default"} className="m-4"><AlertDescription>{notification.message}</AlertDescription></Alert>}
      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-slate-50"><TableRow className="border-slate-200 hover:bg-slate-50"><SortHeader field="make" sort={sort} direction={direction} onSort={toggleSort}>Vehicle</SortHeader><TableHead className="font-semibold text-slate-600">Category</TableHead><TableHead className="font-semibold text-slate-600">Availability</TableHead><SortHeader field="price" align="right" sort={sort} direction={direction} onSort={toggleSort}>Price</SortHeader><TableHead className="font-semibold text-slate-600">Specifications</TableHead><SortHeader field="date_posted" sort={sort} direction={direction} onSort={toggleSort}>Listed</SortHeader><TableHead className="text-right font-semibold text-slate-600">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="h-48 text-center text-slate-500">Loading inventory…</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={7} className="h-48 text-center"><Search className="mx-auto mb-3 h-5 w-5 text-slate-400" /><p className="font-medium text-slate-700">No inventory matches these filters.</p><Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button></TableCell></TableRow> : data.map(bike => (
              <TableRow key={bike.id} className="border-slate-100 hover:bg-slate-50/70">
                <TableCell><div className="font-semibold text-slate-950">{bike.year ? `${bike.year} ` : ""}{bike.make} {bike.model}</div><div className="mt-1 text-xs text-slate-500">Stock {bike.stock_number || "—"}{bike.rego ? ` · Rego ${bike.rego}` : ""}</div></TableCell>
                <TableCell><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{label(bike.vehicle_type)}</Badge><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{label(bike.condition)}</Badge></div></TableCell>
                <TableCell><Badge variant="outline" className={statusClass[bike.status]}>{label(bike.status)}</Badge><div className="mt-1.5 flex gap-1.5">{bike.is_hire && <span className="text-xs font-medium text-violet-700">Hire{bike.daily_rate ? ` · ${money(bike.daily_rate)}/day` : ""}</span>}</div></TableCell>
                <TableCell className="text-right"><div className="font-semibold text-slate-950">{money(bike.discount_price || bike.price)}</div>{bike.discount_price && bike.price && <div className="text-xs text-slate-400 line-through">{money(bike.price)}</div>}</TableCell>
                <TableCell><div className="text-sm text-slate-700">{number(bike.engine_size, " cc")} · {bike.transmission ? label(bike.transmission) : "—"}</div><div className="mt-1 text-xs text-slate-500">{number(bike.odometer, " km")}</div></TableCell>
                <TableCell className="text-sm text-slate-600">{bike.date_posted ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(bike.date_posted)) : "—"}</TableCell>
                <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`View ${bike.make} ${bike.model}`} onClick={() => window.open(`/inventory/motorcycles/${bike.slug}`, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Edit ${bike.make} ${bike.model}`} onClick={() => router.push(`/dashboard/edit-motorcycle/${bike.id}`)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${bike.make} ${bike.model}`} onClick={() => removeBike(bike)} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm text-slate-500">Showing {total ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString("en-AU")}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setQuery({ page: String(page - 1) })} className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button><span className="min-w-20 text-center text-sm text-slate-600">Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => setQuery({ page: String(page + 1) })} className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">Next <ChevronRight className="ml-1 h-4 w-4" /></Button></div></footer>
    </section>
  );
}
