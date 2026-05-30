"use client";

import { Download, Eye, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getReportPreview } from "@/lib/actions/admin";

type ReportType = "daily" | "weekly" | "monthly";

type PreviewData = {
  periodLabel: string;
  filename: string;
  summary: {
    newStudents: number;
    activeEnrollments: number;
    totalRevenue: number;
    pendingPayments: number;
    totalPayments: number;
    totalClasses: number;
  };
};

export function ReportGenerator() {
  const [selectedType, setSelectedType] = useState<ReportType>("daily");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    setPreview(null);
    try {
      const res = await getReportPreview(selectedType);
      if (res.success) {
        setPreview({
          summary: res.summary,
          periodLabel: res.periodLabel,
          filename: res.filename,
        });
        toast.success("Preview generated");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/reports?type=${selectedType}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") ?? `exceed-${selectedType}-report.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report downloaded successfully");
    } catch (_error) {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  }

  const reportTypes: {
    type: ReportType;
    label: string;
    description: string;
  }[] = [
    {
      type: "daily",
      label: "Daily Report",
      description: "Today's registrations, payments, and activity",
    },
    {
      type: "weekly",
      label: "Weekly Report",
      description: "This week from Sunday to today",
    },
    {
      type: "monthly",
      label: "Monthly Report",
      description: "Full current month overview",
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {reportTypes.map(({ type, label, description }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setSelectedType(type);
              setPreview(null);
            }}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedType === type
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <FileSpreadsheet
                size={18}
                className={
                  selectedType === type ? "text-blue-600" : "text-gray-400"
                }
              />
              <span
                className={`text-sm font-semibold ${
                  selectedType === type ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handlePreview}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Eye size={16} />
          )}
          Preview Report
        </Button>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Download Excel
        </Button>
      </div>

      {preview && (
        <div className="space-y-6 rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}{" "}
                Report Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                {preview.periodLabel}
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Ready to download
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="mb-1 text-xs font-medium text-blue-600">
                New Students
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {preview.summary.newStudents}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="mb-1 text-xs font-medium text-green-600">
                Active Enrollments
              </p>
              <p className="text-2xl font-bold text-green-700">
                {preview.summary.activeEnrollments}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="mb-1 text-xs font-medium text-amber-600">
                Revenue (ETB)
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {preview.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="mb-1 text-xs font-medium text-red-600">
                Pending (ETB)
              </p>
              <p className="text-2xl font-bold text-red-700">
                {preview.summary.pendingPayments.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="mb-1 text-xs font-medium text-purple-600">
                Payment Transactions
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {preview.summary.totalPayments}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-1 text-xs font-medium text-gray-600">
                Active Classes
              </p>
              <p className="text-2xl font-bold text-gray-700">
                {preview.summary.totalClasses}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Excel file contains 5 sheets:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Summary",
                "New Registrations",
                "Active Students",
                "Payments",
                "Classes Overview",
              ].map((sheet) => (
                <span
                  key={sheet}
                  className="rounded border bg-white px-2 py-1 text-xs"
                >
                  📄 {sheet}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full gap-2"
            size="lg"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {downloading ? "Downloading..." : `Download ${preview.filename}`}
          </Button>
        </div>
      )}
    </div>
  );
}
