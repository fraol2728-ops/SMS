"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { undropStudent } from "@/lib/actions/admin";
export function UndropButton({
  enrollmentId,
  redirectTo = "/admin/dropped",
}: {
  enrollmentId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function handleUndrop() {
    setLoading(true);
    try {
      const res = await undropStudent(enrollmentId);
      if (res.success) {
        toast.success("Student restored to active");
        router.push(redirectTo);
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      onClick={handleUndrop}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700"
    >
      {loading ? "Restoring..." : "↩️ Undo Drop — Restore Student"}
    </Button>
  );
}
