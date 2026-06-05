"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/lib/actions/admin";

export function DeleteButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await deleteStudent(studentId);
      if (res.success) {
        toast.success("Student and all associated data deleted successfully");
        router.push("/admin/students");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open)
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} className="mr-1" />
        Delete Student
      </Button>
    );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-1 text-red-700 dark:text-red-400">
          Delete Student
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete <strong>{studentName}</strong> and all their information including enrollments, payments, attendance, and assessments? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
