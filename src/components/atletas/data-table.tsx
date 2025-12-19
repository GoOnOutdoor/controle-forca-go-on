"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  OnChangeFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AtletaComCalculos } from "@/types";
import { getRowUrgency } from "./columns";

const rowUrgencyStyles: Record<string, string> = {
  critical: "bg-red-100/70 hover:bg-red-100 border-l-6 border-l-red-600",
  warning: "bg-orange-100/60 hover:bg-orange-100 border-l-6 border-l-orange-600",
  attention: "bg-yellow-100/50 hover:bg-yellow-100 border-l-6 border-l-yellow-600",
  normal: "hover:bg-muted/50",
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: OnChangeFn<VisibilityState>;
  rowSelection?: Record<string, boolean>;
  setRowSelection?: OnChangeFn<Record<string, boolean>>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  onRowClick?: (row: TData) => void;
  meta?: any;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  sorting: controlledSorting,
  setSorting: setControlledSorting,
  columnVisibility: controlledVisibility,
  setColumnVisibility: setControlledVisibility,
  rowSelection: controlledRowSelection,
  setRowSelection: setControlledRowSelection,
  columnFilters: controlledFilters,
  setColumnFilters: setControlledFilters,
  onRowClick,
  meta,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setControlledSorting,
    onColumnVisibilityChange: setControlledVisibility,
    onRowSelectionChange: setControlledRowSelection,
    onColumnFiltersChange: setControlledFilters,
    state: {
      sorting: controlledSorting,
      columnVisibility: controlledVisibility,
      rowSelection: controlledRowSelection,
      columnFilters: controlledFilters,
    },
    meta,
  });

  return (
    <div className="rounded-md border overflow-x-auto">
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
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const atleta = row.original as AtletaComCalculos;
              const urgency = getRowUrgency(atleta);

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    rowUrgencyStyles[urgency]
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick?.(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                Nenhum atleta encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
