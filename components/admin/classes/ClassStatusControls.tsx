"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateClassStatus } from "@/lib/actions/admin";
export function ClassStatusControls({
  classId,
  status,
}: {
  classId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function setStatus(next: "STARTED" | "ENDED") {
    setLoading(true);
    try {
      const res = await updateClassStatus(classId, next);
      if (res.success) {
        toast.success("Class status updated");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex gap-2">
      {status === "REGISTRATION" && (
        <Button disabled={loading} onClick={() => setStatus("STARTED")}>
          🚀 Start Class
        </Button>
      )}
      {status === "STARTED" && (
        <Button disabled={loading} onClick={() => setStatus("ENDED")}>
          🏁 End Class
        </Button>
      )}
    </div>
  );
}
