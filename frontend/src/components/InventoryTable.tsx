"use client"

import { useState, useEffect, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useNavigate } from "react-router-dom"
import { deleteMotorcycle, getBikes } from "@/api"
import type { Bike } from "@/types/Bike"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Main InventoryTable Component
const InventoryTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Bike[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });
  const [pageCount, setPageCount] = useState(0);
  const [conditionFilter, setConditionFilter] = useState<'new' | 'used' | null>(null);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        // Tanstack table is 0-indexed, API is 1-indexed
        const response = await getBikes({ condition: conditionFilter || undefined, page: pageIndex + 1 });
        setData(response.results);
        setPageCount(Math.ceil(response.count / pageSize));
      } catch (error) {
        console.error("Failed to fetch bikes:", error);
        setNotification({ message: "Failed to fetch bikes", type: 'error' });
      }
    };
    fetchBikes();
  }, [pageIndex, pageSize, conditionFilter]);

  const handleDelete = async (id: number) => {
    setNotification(null);
    if (window.confirm("Are you sure you want to delete this motorcycle?")) {
      try {
        await deleteMotorcycle(id);
        // Refetch the current page to show the updated data
        const response = await getBikes({ condition: conditionFilter || undefined, page: pageIndex + 1 });
        setData(response.results);
        setPageCount(Math.ceil(response.count / pageSize));
        setNotification({ message: "Motorcycle deleted successfully", type: 'success' });
      } catch (error) {
        console.error("Failed to delete motorcycle:", error);
        setNotification({ message: "Failed to delete motorcycle", type: 'error' });
      }
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/dashboard/edit-motorcycle/${id}`);
  };
  
  const handleFilterChange = (filter: 'new' | 'used' | null) => {
    setPagination({ pageIndex: 0, pageSize });
    setConditionFilter(filter);
  };

  const columns: ColumnDef<Bike>[] = useMemo(() => [
    {
      accessorKey: "condition",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[var(--text-dark-primary)]"
        >
          Condition
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { accessorKey: "year", header: () => <div className="text-[var(--text-dark-primary)]">Year</div> },
    { accessorKey: "make", header: () => <div className="text-[var(--text-dark-primary)]">Make</div> },
    { accessorKey: "model", header: () => <div className="text-[var(--text-dark-primary)]">Model</div> },
    {
      accessorKey: "price",
      header: () => <div className="text-right text-[var(--text-dark-primary)]">Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(amount);
        return <div className="text-right font-medium text-[var(--text-dark-primary)]">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-[var(--text-dark-primary)]">Status</div>,
      cell: ({ row }) => <Badge variant="outline" className="text-[var(--text-dark-primary)] border-black">{row.getValue("status")}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)} className="text-[var(--text-dark-primary)]">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: data,
    columns,
    pageCount,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    manualPagination: true,
    state: {
      sorting,
      pagination,
    },
  });

  return (
    <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center space-x-2 py-4">
        <Button 
          variant="outline"
          onClick={() => handleFilterChange(null)} 
          className={!conditionFilter ? 'bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
        >
          All
        </Button>
        <Button 
          variant="outline"
          onClick={() => handleFilterChange('new')} 
          className={conditionFilter === 'new' ? 'bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
        >
          New
        </Button>
        <Button 
          variant="outline"
          onClick={() => handleFilterChange('used')} 
          className={conditionFilter === 'used' ? 'bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
        >
          Used
        </Button>
      </div>
      <div className="rounded-md border border-border-light overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border-light">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[var(--text-dark-primary)]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-border-light"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-[var(--text-dark-primary)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[var(--text-dark-primary)]">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4 text-[var(--text-dark-primary)]">
        <div className="text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50 text-[var(--text-dark-secondary)]" : "text-[var(--text-dark-primary)]"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50 text-[var(--text-dark-secondary)]" : "text-[var(--text-dark-primary)]"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default InventoryTable;