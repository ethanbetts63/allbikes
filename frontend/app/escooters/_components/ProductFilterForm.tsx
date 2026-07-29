import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { FilterSortOptions } from '@/types/FilterSortOptions';

interface ProductFilterFormProps {
  basePath: string;
  filters: FilterSortOptions;
}

export default function ProductFilterForm({ basePath, filters }: ProductFilterFormProps) {
  return (
    <form action={basePath} method="GET" className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="product-ordering" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Sort By</label>
          <select
            id="product-ordering"
            name="ordering"
            defaultValue={filters.ordering ?? ''}
            className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm h-9 w-full rounded-md border bg-transparent px-3 py-2 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Price ($)</span>
          <div className="flex gap-2">
            <input
              type="number"
              name="min_price"
              placeholder="Min"
              defaultValue={filters.min_price ?? ''}
              className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
            <input
              type="number"
              name="max_price"
              placeholder="Max"
              defaultValue={filters.max_price ?? ''}
              className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 bg-highlight text-[var(--text-dark-primary)] font-bold hover:bg-highlight/80 text-sm">
            Apply Filters
          </Button>
          <Button asChild variant="outline" className="border-[var(--border-light)] bg-white text-black hover:bg-gray-100 hover:text-black text-sm">
            <Link href={basePath}>Clear</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
