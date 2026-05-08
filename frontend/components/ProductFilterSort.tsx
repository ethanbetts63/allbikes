import { useState, useEffect, type ChangeEvent } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
import type { FilterSortProps } from '@/types/FilterSortProps';

const ProductFilterSort = ({ options, onFilterChange }: FilterSortProps) => {
  const [localOptions, setLocalOptions] = useState<FilterSortOptions>(options);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalOptions({ ...localOptions, [name]: value ? Number(value) : undefined });
  };

  const handleOrderingChange = (value: string) => {
    setLocalOptions({ ...localOptions, ordering: value === 'default' ? undefined : value });
  };

  const handleApplyFilters = () => {
    onFilterChange(localOptions);
  };

  return (
    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Sort By</span>
          <Select onValueChange={handleOrderingChange} value={localOptions.ordering || 'default'}>
            <SelectTrigger className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">Price ($)</span>
          <div className="flex gap-2">
            <Input
              type="number"
              name="min_price"
              placeholder="Min"
              value={localOptions.min_price || ''}
              onChange={handleInputChange}
              className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm"
            />
            <Input
              type="number"
              name="max_price"
              placeholder="Max"
              value={localOptions.max_price || ''}
              onChange={handleInputChange}
              className="border-[var(--border-light)] text-[var(--text-dark-primary)] text-sm"
            />
          </div>
        </div>

        {/* Apply */}
        <Button
          onClick={handleApplyFilters}
          className="w-full bg-highlight text-[var(--text-dark-primary)] font-bold hover:bg-highlight/80 text-sm"
        >
          Apply Filters
        </Button>

      </div>
    </div>
  );
};

export default ProductFilterSort;
