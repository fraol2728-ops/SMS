"use client";

import { toast } from "sonner";
import * as XLSX from "xlsx";

export function ExportCertificatesButton({
  certificates,
}: {
  certificates: any[];
}) {
  function handleExport() {
    const headers = [
      "Student Name",
      "Course",
      "Payment Status",
      "Payment Method",
      "Issued Date",
      "Delivered",
      "Notes",
    ];
    const rows = certificates.map((c) => [
      c.manualStudentName ??
        (`${c.student?.user?.firstName ?? ""} ${c.student?.user?.lastName ?? ""}`.trim() ||
          "—"),
      c.course.title,
      c.paymentStatus,
      c.paymentMethod ?? "",
      new Date(c.issuedAt).toLocaleDateString("en-GB"),
      c.isDelivered ? "Yes" : "No",
      c.notes ?? "",
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");
    const buffer = XLSX.write(wb, {
      type: "array",
      bookType: "xlsx",
    } as any) as unknown as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificates-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificates exported");
  }
  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
    >
      📥 Export Excel
    </button>
  );
}
