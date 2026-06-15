"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteTeacher } from "@/lib/actions/admin";

export function DeleteTeacherButton({
  teacherUserId,
  teacherName,
}: {
  teacherUserId: string;
  teacherName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete ${teacherName}? This removes their account and data. Classes will need to be reassigned. This cannot be undone.`,
      )
    )
      return;
    setLoading(true);
    try {
      const res = await deleteTeacher(teacherUserId);
      if (res.success) {
        toast.success("Teacher deleted");
        router.push("/admin/teachers");
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-900 transition-colors disabled:opacity-50"
      type="button"
    >
      <Trash2 size={14} />
      {loading ? "Deleting..." : "Delete Teacher"}
    </button>
  );
}
