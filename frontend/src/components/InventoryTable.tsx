"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
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
import { useNavigate } from "react-router-dom"
import { deleteMotorcycle, getBikes } from "@/api"
import { toast } from "sonner"
import { Bike } from "@/types"


// Main InventoryTable Component
const InventoryTable = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Bike[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [conditionFilter, setConditionFilter] = React.useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this motorcycle?")) {
      try {
        await deleteMotorcycle(id);
        setData(data.filter(bike => bike.id !== id));
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

  // Column Definitions are moved inside the component
  const columns: ColumnDef<Bike>[] = [
    {
      accessorKey: "condition",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Condition
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "year",
      header: "Year",
    },
    {
      accessorKey: "make",
      header: "Make",
    },
    {
      accessorKey: "model",
      header: "Model",
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          return <Badge variant="outline">{row.getValue("status")}</Badge>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ];

  React.useEffect(() => {
    const fetchBikes = async () => {
      try {
        const bikes = await getBikes();
        setData(bikes.results);
      } catch (error) {
        console.error("Failed to fetch bikes:", error);
      }
    };
    fetchBikes();
  }, []);
  
  const filteredData = React.useMemo(() => {
    if (!conditionFilter) {
        return data;
    }
    return data.filter(bike => bike.condition === conditionFilter);
  }, [data, conditionFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="w-full">
        <div className="flex items-center space-x-2 py-4">
            <Button variant={!conditionFilter ? "default" : "outline"} onClick={() => setConditionFilter(null)}>All</Button>
            <Button variant={conditionFilter === 'new' ? "default" : "outline"} onClick={() => setConditionFilter('new')}>New</Button>
            <Button variant={conditionFilter === 'used' ? "default" : "outline"} onClick={() => setConditionFilter('used')}>Used</Button>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
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
    </div>
  )
}

export default InventoryTable;
