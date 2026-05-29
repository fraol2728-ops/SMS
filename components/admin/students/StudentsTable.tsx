"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/shared/DataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StudentTableRow = {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  course: string;
  schedule: string;
  days: string;
  classType: string | null;
  paymentStatus: string;
};

function classTypeLabel(classType: string | null) {
  if (!classType) return "-";
  return classType.charAt(0) + classType.slice(1).toLowerCase();
}

export function StudentsTable({ students }: { students: StudentTableRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      students.filter((student) =>
        `${student.studentCode} ${student.fullName} ${student.phone} ${student.course}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [students, search],
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by code, name, phone, or course"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <DataTable
        columns={[
          { key: "studentCode", label: "Student Code" },
          { key: "fullName", label: "Full Name" },
          { key: "phone", label: "Phone" },
          { key: "course", label: "Course" },
          { key: "schedule", label: "Schedule" },
          { key: "days", label: "Days" },
          {
            key: "classType",
            label: "Class Type",
            render: (row) =>
              row.classType ? (
                <Badge
                  className={cn(
                    "border-0",
                    row.classType === "GROUP"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700",
                  )}
                >
                  {classTypeLabel(row.classType)}
                </Badge>
              ) : (
                "-"
              ),
          },
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
