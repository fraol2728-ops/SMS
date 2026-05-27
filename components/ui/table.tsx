import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}
export function TableHeader(props: React.ComponentProps<"thead">) { return <thead className="[&_tr]:border-b" {...props} />; }
export function TableBody(props: React.ComponentProps<"tbody">) { return <tbody className="[&_tr:last-child]:border-0" {...props} />; }
export function TableRow(props: React.ComponentProps<"tr">) { return <tr className="border-b transition-colors hover:bg-muted/50" {...props} />; }
export function TableHead(props: React.ComponentProps<"th">) { return <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground" {...props} />; }
export function TableCell(props: React.ComponentProps<"td">) { return <td className="p-2 align-middle" {...props} />; }
