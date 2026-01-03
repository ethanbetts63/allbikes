"use client"

import * as React from "react"
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
import { toast } from "sonner"
import type { Bike } from "@/types"

// Main InventoryTable Component
const InventoryTable = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Bike[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });
  const [pageCount, setPageCount] = React.useState(0);
  const [conditionFilter, setConditionFilter] = React.useState<'new' | 'used' | null>(null);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  React.useEffect(() => {
    const fetchBikes = async () => {
      try {
        // Tanstack table is 0-indexed, API is 1-indexed
        const response = await getBikes(conditionFilter || undefined, pageIndex + 1, pageSize);
        setData(response.results);
        setPageCount(Math.ceil(response.count / response.page_size));
      } catch (error) {
        console.error("Failed to fetch bikes:", error);
        toast.error("Failed to fetch bikes");
      }
    };
    fetchBikes();
  }, [pageIndex, pageSize, conditionFilter]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this motorcycle?")) {
      try {
        await deleteMotorcycle(id);
        // Refetch the current page to show the updated data
        const response = await getBikes(conditionFilter || undefined, pageIndex + 1, pageSize);
        setData(response.results);
        setPageCount(Math.ceil(response.count / response.page_size));
        toast.success("Motorcycle deleted successfully");
      } catch (error) {
        console.error("Failed to delete motorcycle:", error);
        toast.error("Failed to delete motorcycle");
      }
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/edit-motorcycle/${id}`);
  };
  
  const handleFilterChange = (filter: 'new' | 'used' | null) => {
    setPagination({ pageIndex: 0, pageSize });
    setConditionFilter(filter);
  };

  const columns: ColumnDef<Bike>[] = React.useMemo(() => [
    {
      accessorKey: "condition",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Condition
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { accessorKey: "year", header: "Year" },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("status")}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
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
    <div className="w-full">
      <div className="flex items-center space-x-2 py-4">
        <Button variant={!conditionFilter ? "default" : "outline"} onClick={() => handleFilterChange(null)}>All</Button>
        <Button variant={conditionFilter === 'new' ? "default" : "outline"} onClick={() => handleFilterChange('new')}>New</Button>
        <Button variant={conditionFilter === 'used' ? "default" : "outline"} onClick={() => handleFilterChange('used')}>Used</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
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
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default InventoryTable;

