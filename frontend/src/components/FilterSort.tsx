import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface FilterSortOptions {
  ordering?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  min_engine_size?: number;
  max_engine_size?: number;
}

interface FilterSortProps {
  options: FilterSortOptions;
  onFilterChange: (newOptions: FilterSortOptions) => void;
}

const FilterSort: React.FC<FilterSortProps> = ({ options, onFilterChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...options, [name]: value ? Number(value) : undefined });
  };

  const handleOrderingChange = (value: string) => {
    onFilterChange({ ...options, ordering: value });
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Ordering */}
        <div className="flex flex-col">
          <Label htmlFor="ordering" className="mb-2 font-semibold">Sort By</Label>
          <Select onValueChange={handleOrderingChange} value={options.ordering}>
            <SelectTrigger id="ordering">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="year_desc">Year: New to Old</SelectItem>
              <SelectItem value="year_asc">Year: Old to New</SelectItem>
              <SelectItem value="engine_size_asc">Engine: Low to High</SelectItem>
              <SelectItem value="engine_size_desc">Engine: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="flex flex-col">
          <Label className="mb-2 font-semibold">Price Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              name="min_price"
              placeholder="Min"
              value={options.min_price || ''}
              onChange={handleInputChange}
            />
            <Input
              type="number"
              name="max_price"
              placeholder="Max"
              value={options.max_price || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="flex flex-col">
          <Label className="mb-2 font-semibold">Year Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              name="min_year"
              placeholder="Min"
              value={options.min_year || ''}
              onChange={handleInputChange}
            />
            <Input
              type="number"
              name="max_year"
              placeholder="Max"
              value={options.max_year || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Engine Size Range */}
        <div className="flex flex-col">
          <Label className="mb-2 font-semibold">Engine (cc)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              name="min_engine_size"
              placeholder="Min"
              value={options.min_engine_size || ''}
              onChange={handleInputChange}
            />
            <Input
              type="number"
              name="max_engine_size"
              placeholder="Max"
              value={options.max_engine_size || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex items-end">
            <Button onClick={() => onFilterChange(options)} className="w-full">
                Apply Filters
            </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterSort;
