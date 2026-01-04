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
        const response = await getBikes(conditionFilter || undefined, pageIndex + 1);
        setData(response.results);
        setPageCount(Math.ceil(response.count / pageSize));
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
        const response = await getBikes(conditionFilter || undefined, pageIndex + 1);
        setData(response.results);
        setPageCount(Math.ceil(response.count / pageSize));
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
          className="text-black"
        >
          Condition
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { accessorKey: "year", header: () => <div className="text-black">Year</div> },
    { accessorKey: "make", header: () => <div className="text-black">Make</div> },
    { accessorKey: "model", header: () => <div className="text-black">Model</div> },
    {
      accessorKey: "price",
      header: () => <div className="text-right text-black">Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(amount);
        return <div className="text-right font-medium text-black">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-black">Status</div>,
      cell: ({ row }) => <Badge variant="outline" className="text-black border-black">{row.getValue("status")}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)} className="text-black">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} className="text-red-500">
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
    <div className="w-full bg-white text-black p-4 rounded-lg">
      <div className="flex items-center space-x-2 py-4">
        <Button variant={!conditionFilter ? "secondary" : "outline"} onClick={() => handleFilterChange(null)} className="text-black border-gray-300">All</Button>
        <Button variant={conditionFilter === 'new' ? "secondary" : "outline"} onClick={() => handleFilterChange('new')} className="text-black border-gray-300">New</Button>
        <Button variant={conditionFilter === 'used' ? "secondary" : "outline"} onClick={() => handleFilterChange('used')} className="text-black border-gray-300">Used</Button>
      </div>
      <div className="rounded-md border border-gray-300">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-gray-300">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-black">
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
                  className="border-gray-300"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-black">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-black">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4 text-black">
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
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50 text-gray-400" : "text-black"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50 text-gray-400" : "text-black"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default InventoryTable;