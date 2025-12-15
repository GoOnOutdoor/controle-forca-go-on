import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function AtletasTableSkeleton() {
  const rows = Array.from({ length: 6 });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full hidden lg:block" />
      </div>

      {/* Versão desktop */}
      <div className="rounded-md border overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 12 }).map((_, idx) => (
                <TableHead key={idx}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((_, idx) => (
              <TableRow key={idx}>
                {Array.from({ length: 12 }).map((__, cellIdx) => (
                  <TableCell key={cellIdx}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Versão mobile */}
      <div className="grid gap-3 md:hidden">
        {rows.map((_, idx) => (
          <div key={idx} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
