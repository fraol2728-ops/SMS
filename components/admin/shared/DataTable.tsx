import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data found.",
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border dark:border-gray-700">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, idx) => (
              <TableRow
                className="border-b odd:bg-muted/30 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                key={String(row.id ?? idx)}
              >
                {columns.map((column) => (
                  <TableCell
                    className="dark:text-white"
                    key={`${column.key}-${idx}`}
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="py-8 text-center text-gray-500 dark:text-gray-400"
                colSpan={columns.length}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
