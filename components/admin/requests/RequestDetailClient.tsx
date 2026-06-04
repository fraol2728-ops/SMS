"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteRequest, updateRequestStatus } from "@/lib/actions/requests";

type CourseRequestDetail = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  courseName: string;
  notes?: string | null;
  status: string;
  createdAt: Date | string;
};

export function RequestDetailClient({
  request,
  redirectTo = "/admin/requests",
  studentCreateBasePath = "/admin/students/new",
}: {
  request: CourseRequestDetail;
  redirectTo?: string;
  studentCreateBasePath?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);
  async function handleStatusUpdate(newStatus: string) {
    setLoading(true);
    try {
      const res = await updateRequestStatus(request.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success("Status updated");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  async function handleDelete() {
    if (!confirm("Delete this request?")) return;
    const res = await deleteRequest(request.id);
    if (res.success) {
      toast.success("Request deleted");
      router.push(redirectTo);
    }
  }
  const regUrl = `${studentCreateBasePath}?firstName=${encodeURIComponent(request.firstName)}&lastName=${encodeURIComponent(request.lastName)}&phone=${encodeURIComponent(request.phone)}`;
  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "First Name", value: request.firstName },
          { label: "Last Name", value: request.lastName },
          { label: "Requested Course", value: request.courseName },
          {
            label: "Date",
            value: new Date(request.createdAt).toLocaleDateString("en-GB"),
          },
          { label: "Status", value: status },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="font-medium text-sm dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      {request.notes && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-5">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm dark:text-gray-300">{request.notes}</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => window.open(`tel:${request.phone}`, "_self")}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-medium mb-6"
      >
        <Phone size={15} /> Call {request.phone}
      </button>
      <div className="mb-5">
        <p className="text-sm font-medium dark:text-white mb-2">
          Update Status
        </p>
        <div className="flex flex-wrap gap-2">
          {["PENDING", "CONTACTED", "ENROLLED", "DECLINED"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => handleStatusUpdate(s)}
              disabled={loading || status === s}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
        <Link href={regUrl}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            👤 Register as Student
          </Button>
        </Link>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          onClick={handleDelete}
        >
          Delete Request
        </Button>
      </div>
    </div>
  );
}
