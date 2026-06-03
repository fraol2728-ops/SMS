"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendReport } from "@/lib/actions/teacher";

type Student = { id: string; name: string; course: string; code: string };

const REPORT_TYPES = [
  { value: "GENERAL", label: "General Report" },
  { value: "STUDENT_PROGRESS", label: "Student Progress" },
  { value: "BEHAVIOR", label: "Behavior Issue" },
  { value: "ATTENDANCE_CONCERN", label: "Attendance Concern" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "OTHER", label: "Other" },
];

export function TeacherReportForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("GENERAL");
  const [selectedStudent, setSelectedStudent] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await sendReport(formData);
      if (res.success) {
        toast.success("Report sent to admin successfully");
        e.currentTarget.reset();
        setReportType("GENERAL");
        setSelectedStudent("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5 flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Send New Report
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Report Type *</Label>
          <select
            name="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Related Student (optional)</Label>
          <select
            name="studentId"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">General report (not student-specific)</option>
            {students.map((s) => (
              <option key={`${s.id}-${s.course}`} value={s.id}>
                {s.name} — {s.course} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Brief summary of the report..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">Details *</Label>
          <Textarea
            id="content"
            name="content"
            required
            rows={5}
            placeholder="Provide detailed information about the report..."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Sending..." : "Send Report to Admin"}
        </Button>
      </form>
    </div>
  );
}
