"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/shared/DataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type StudentTableRow = {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  lab: string;
  course: string;
  time: string;
  days: string;
  paymentStatus: string;
};

export function StudentsTable({ students }: { students: StudentTableRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      students.filter((student) =>
        `${student.studentCode} ${student.fullName} ${student.phone} ${student.lab} ${student.course}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [students, search],
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by code, name, phone, lab, or course"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <DataTable
        columns={[
          { key: "studentCode", label: "Student Code" },
          { key: "fullName", label: "Full Name" },
          { key: "phone", label: "Phone" },
          { key: "lab", label: "Lab" },
          { key: "course", label: "Course" },
          { key: "time", label: "Time" },
          { key: "days", label: "Days" },
          {
            key: "paymentStatus",
            label: "Payment Status",
            render: (row) => <StatusBadge status={row.paymentStatus} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="space-x-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/students/${row.id}`}>View</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/students/${row.id}/edit`}>Edit</Link>
                </Button>
              </div>
            ),
          },
        ]}
        data={filtered}
      />
    </div>
  );
}
