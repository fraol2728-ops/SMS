"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StudentsTable({ students }: { students: any[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => students.filter((s) => `${s.fullName} ${s.email}`.toLowerCase().includes(search.toLowerCase())), [students, search]);

  return (
    <div className="space-y-4">
      <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      <DataTable columns={[
        { key: "studentCode", label: "Code" },
        { key: "fullName", label: "Full name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "courses", label: "Courses" },
        { key: "status", label: "Status", render: (r) => r.status ? <StatusBadge status={r.status} /> : <span className="text-sm text-muted-foreground">No enrollment</span> },
        { key: "actions", label: "Actions", render: (r) => <div className="space-x-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/students/${r.id}`}>View</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/admin/students/${r.id}/edit`}>Edit</Link></Button></div> },
      ]} data={filtered} />
    </div>
  );
}
