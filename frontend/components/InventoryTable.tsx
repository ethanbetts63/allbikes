"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Pencil, Search, SlidersHorizontal, Star, Trash2, X } from "lucide-react";
import { deleteMotorcycle, getBikes } from "@/api";
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
const sortFields = ["date_posted", "make", "model", "year", "condition", "vehicle_type", "price", "engine_size", "status"] as const;
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
  const featured = params.get("featured") === "true";
  const hire = params.get("hire") === "true";
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
      is_featured: featured || undefined,
      is_hire: hire || undefined,
      ordering: `${sort}_${direction}`,
      page,
      page_size: PAGE_SIZE,
      min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
      max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
      min_year: params.get("min_year") ? Number(params.get("min_year")) : undefined,
      max_year: params.get("max_year") ? Number(params.get("max_year")) : undefined,
      min_engine_size: params.get("min_engine_size") ? Number(params.get("min_engine_size")) : undefined,
      max_engine_size: params.get("max_engine_size") ? Number(params.get("max_engine_size")) : undefined,
    }).then(response => {
      if (!active) return;
      setData(response.results);
      setTotal(response.count);
    }).catch(() => {
      if (active) setNotification({ message: "Could not load inventory. Please try again.", type: "error" });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [condition, direction, featured, hire, page, params, refreshKey, sort, status, vehicleType]);

  const updateFilter = (key: string, value: string) => setQuery({ [key]: value || null, page: null });
  const toggleSort = (field: SortField) => setQuery({ sort: field, direction: sort === field && direction === "asc" ? "desc" : "asc", page: null });
  const clearFilters = () => router.replace(pathname, { scroll: false });
  const activeFilters = [condition, vehicleType, status, featured ? "featured" : "", hire ? "hire" : "", params.get("min_price"), params.get("max_price"), params.get("min_year"), params.get("max_year"), params.get("min_engine_size"), params.get("max_engine_size")].filter(Boolean).length;

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
            <Button variant="outline" size="sm" onClick={() => setQuery({ featured: featured ? null : "true", page: null })} className={featured ? "border-amber-300 bg-amber-50 text-amber-900" : "bg-white"}><Star className="mr-1.5 h-3.5 w-3.5" /> Featured</Button>
            <Button variant="outline" size="sm" onClick={() => setQuery({ hire: hire ? null : "true", page: null })} className={hire ? "border-violet-300 bg-violet-50 text-violet-900" : "bg-white"}>Hire fleet</Button>
            {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-600"><X className="mr-1 h-3.5 w-3.5" /> Clear filters</Button>}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select value={condition || "all"} onValueChange={value => updateFilter("condition", value === "all" ? "" : value)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All conditions" /></SelectTrigger><SelectContent><SelectItem value="all">All conditions</SelectItem>{conditionValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent></Select>
          <Select value={vehicleType || "all"} onValueChange={value => updateFilter("vehicle_type", value === "all" ? "" : value)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All vehicle types" /></SelectTrigger><SelectContent><SelectItem value="all">All vehicle types</SelectItem>{vehicleTypeValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent></Select>
          <Select value={status || "all"} onValueChange={value => updateFilter("status", value === "all" ? "" : value)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="All sale statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All sale statuses</SelectItem>{statusValues.map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent></Select>
          <Input key={`min-price-${params.get("min_price") ?? ""}`} aria-label="Minimum price" type="number" min="0" placeholder="Min price" defaultValue={params.get("min_price") ?? ""} onBlur={event => updateFilter("min_price", event.target.value)} />
          <Input key={`max-price-${params.get("max_price") ?? ""}`} aria-label="Maximum price" type="number" min="0" placeholder="Max price" defaultValue={params.get("max_price") ?? ""} onBlur={event => updateFilter("max_price", event.target.value)} />
          <div className="grid grid-cols-2 gap-2"><Input key={`min-year-${params.get("min_year") ?? ""}`} aria-label="Minimum year" type="number" placeholder="From year" defaultValue={params.get("min_year") ?? ""} onBlur={event => updateFilter("min_year", event.target.value)} /><Input key={`max-year-${params.get("max_year") ?? ""}`} aria-label="Maximum year" type="number" placeholder="To year" defaultValue={params.get("max_year") ?? ""} onBlur={event => updateFilter("max_year", event.target.value)} /></div>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-950">More filters: engine size</summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm"><Input key={`min-engine-${params.get("min_engine_size") ?? ""}`} aria-label="Minimum engine size" type="number" min="0" placeholder="Min engine cc" defaultValue={params.get("min_engine_size") ?? ""} onBlur={event => updateFilter("min_engine_size", event.target.value)} /><Input key={`max-engine-${params.get("max_engine_size") ?? ""}`} aria-label="Maximum engine size" type="number" min="0" placeholder="Max engine cc" defaultValue={params.get("max_engine_size") ?? ""} onBlur={event => updateFilter("max_engine_size", event.target.value)} /></div>
        </details>
      </div>

      {notification && <Alert variant={notification.type === "error" ? "destructive" : "default"} className="m-4"><AlertDescription>{notification.message}</AlertDescription></Alert>}
      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-slate-50"><TableRow className="border-slate-200 hover:bg-slate-50"><SortHeader field="make" sort={sort} direction={direction} onSort={toggleSort}>Vehicle</SortHeader><SortHeader field="condition" sort={sort} direction={direction} onSort={toggleSort}>Category</SortHeader><SortHeader field="status" sort={sort} direction={direction} onSort={toggleSort}>Availability</SortHeader><SortHeader field="price" align="right" sort={sort} direction={direction} onSort={toggleSort}>Price</SortHeader><SortHeader field="engine_size" sort={sort} direction={direction} onSort={toggleSort}>Specifications</SortHeader><SortHeader field="date_posted" sort={sort} direction={direction} onSort={toggleSort}>Listed</SortHeader><TableHead className="text-right font-semibold text-slate-600">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="h-48 text-center text-slate-500">Loading inventory…</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={7} className="h-48 text-center"><Search className="mx-auto mb-3 h-5 w-5 text-slate-400" /><p className="font-medium text-slate-700">No inventory matches these filters.</p><Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button></TableCell></TableRow> : data.map(bike => (
              <TableRow key={bike.id} className="border-slate-100 hover:bg-slate-50/70">
                <TableCell><div className="font-semibold text-slate-950">{bike.year ? `${bike.year} ` : ""}{bike.make} {bike.model}</div><div className="mt-1 text-xs text-slate-500">Stock {bike.stock_number || "—"}{bike.rego ? ` · Rego ${bike.rego}` : ""}</div></TableCell>
                <TableCell><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{label(bike.vehicle_type)}</Badge><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{label(bike.condition)}</Badge></div></TableCell>
                <TableCell><Badge variant="outline" className={statusClass[bike.status]}>{label(bike.status)}</Badge><div className="mt-1.5 flex gap-1.5">{bike.is_featured && <span className="text-xs font-medium text-amber-700">Featured</span>}{bike.is_hire && <span className="text-xs font-medium text-violet-700">Hire{bike.daily_rate ? ` · ${money(bike.daily_rate)}/day` : ""}</span>}</div></TableCell>
                <TableCell className="text-right"><div className="font-semibold text-slate-950">{money(bike.discount_price || bike.price)}</div>{bike.discount_price && bike.price && <div className="text-xs text-slate-400 line-through">{money(bike.price)}</div>}</TableCell>
                <TableCell><div className="text-sm text-slate-700">{number(bike.engine_size, " cc")} · {bike.transmission ? label(bike.transmission) : "—"}</div><div className="mt-1 text-xs text-slate-500">{number(bike.odometer, " km")}</div></TableCell>
                <TableCell className="text-sm text-slate-600">{bike.date_posted ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(bike.date_posted)) : "—"}</TableCell>
                <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`View ${bike.make} ${bike.model}`} onClick={() => window.open(`/inventory/motorcycles/${bike.slug}`, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Edit ${bike.make} ${bike.model}`} onClick={() => router.push(`/dashboard/edit-motorcycle/${bike.id}`)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${bike.make} ${bike.model}`} onClick={() => removeBike(bike)} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm text-slate-500">Showing {total ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString("en-AU")}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setQuery({ page: String(page - 1) })}><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button><span className="min-w-20 text-center text-sm text-slate-600">Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => setQuery({ page: String(page + 1) })}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button></div></footer>
    </section>
  );
}
