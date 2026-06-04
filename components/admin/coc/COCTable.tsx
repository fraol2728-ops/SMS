"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { deleteCOCStudent } from "@/lib/actions/coc";

type COCStudentRow = {
  id: string;
  fullName: string;
  gender?: string | null;
  phone?: string | null;
  regNo?: string | null;
  paymentAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  examDate?: Date | string | null;
  result?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  addedBy?: { firstName: string; lastName: string } | null;
};

export function COCTable({
  students,
  basePath = "/admin/coc",
}: {
  students: COCStudentRow[];
  basePath?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search) ||
      (s.regNo ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  async function handleDelete(id: string) {
    if (!confirm("Remove this student from COC list?")) return;
    const res = await deleteCOCStudent(id);
    if (res.success) {
      toast.success("Student removed");
      router.refresh();
    } else toast.error(res.error);
  }
  function handleExport() {
    const headers = [
      "Full Name",
      "Gender",
      "Phone",
      "Reg No",
      "Payment Amount",
      "Payment Status",
      "Payment Method",
      "Exam Date",
      "Result",
      "Notes",
      "Added Date",
    ];
    const rows = students.map((s) => [
      s.fullName,
      s.gender ?? "",
      s.phone ?? "",
      s.regNo ?? "",
      s.paymentAmount,
      s.paymentStatus,
      s.paymentMethod ?? "",
      s.examDate ? new Date(s.examDate).toLocaleDateString("en-GB") : "",
      s.result ?? "Pending",
      s.notes ?? "",
      new Date(s.createdAt).toLocaleDateString("en-GB"),
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "COC Students");
    const buffer = XLSX.write(wb, {
      type: "array" as "buffer",
      bookType: "xlsx",
    }) as unknown as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coc-students-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, phone or reg no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 px-4 text-sm"
        />
        <Button variant="outline" onClick={handleExport}>
          📥 Export Excel
        </Button>
      </div>
      <div className="hidden md:block bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
            <tr>
              {[
                "#",
                "Name",
                "Phone",
                "Reg No",
                "Amount",
                "Payment",
                "Result",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-medium text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr
                key={s.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                <td className="py-3 px-4">
                  <p className="font-medium dark:text-white">{s.fullName}</p>
                  {s.gender && (
                    <p className="text-xs text-gray-400">{s.gender}</p>
                  )}
                </td>
                <td className="py-3 px-4">
                  {s.phone ? (
                    <div className="flex items-center gap-2">
                      <span>{s.phone}</span>
                      <button
                        type="button"
                        onClick={() => window.open(`tel:${s.phone}`, "_self")}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 px-4 text-gray-500">{s.regNo ?? "—"}</td>
                <td className="py-3 px-4 font-medium">
                  ETB {s.paymentAmount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${s.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {s.paymentStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${s.result === "PASS" ? "bg-green-50 text-green-700" : s.result === "FAIL" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {s.result ?? "Pending"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Link
                      href={`${basePath}/${s.id}`}
                      className="text-xs text-blue-600 font-medium"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-red-500 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No COC students found
          </div>
        )}
      </div>
      <div className="md:hidden space-y-2">
        {filtered.map((s) => (
          <Link key={s.id} href={`${basePath}/${s.id}`}>
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-4 flex justify-between">
              <div>
                <p className="font-semibold dark:text-white">{s.fullName}</p>
                <p className="text-sm text-gray-400">{s.phone ?? "—"}</p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${s.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {s.paymentStatus}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  ETB {s.paymentAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
