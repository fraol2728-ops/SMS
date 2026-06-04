"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeFromWaitlist } from "@/lib/actions/admin";
export function WaitlistDetailClient({
  entry,
  basePath = "/admin",
  campusId,
  redirectTo = "/admin/waitlist",
}: {
  entry: any;
  basePath?: "/admin" | "/super-admin";
  campusId?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  async function handleRemove() {
    if (!confirm("Remove this person from the waiting list?")) return;
    const res = await removeFromWaitlist(entry.id);
    if (res.success) {
      toast.success("Removed from waiting list");
      router.push(redirectTo);
    } else toast.error(res.error);
  }
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            {
              label: "Full Name",
              value: `${entry.firstName} ${entry.lastName}`,
            },
            { label: "Phone", value: entry.phone },
            {
              label: "Applied Date",
              value: new Date(entry.appliedDate).toLocaleDateString("en-GB"),
            },
            { label: "Status", value: entry.status },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-2">Courses Can Teach</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {entry.courses.map((c: string) => (
            <span
              key={c}
              className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
            >
              {c}
            </span>
          ))}
        </div>
        {entry.notes && (
          <div className="mb-6 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{entry.notes}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Link
            href={`${basePath}/teachers/new?fromWaitlist=${entry.id}&firstName=${encodeURIComponent(entry.firstName)}&lastName=${encodeURIComponent(entry.lastName)}&phone=${encodeURIComponent(entry.phone)}${campusId ? `&campusId=${campusId}` : ""}`}
          >
            <Button className="bg-green-600 hover:bg-green-700">
              ✅ Join — Add as Teacher
            </Button>
          </Link>
          {basePath === "/admin" ? (
            <Link href={`${basePath}/waitlist/${entry.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          ) : null}
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
