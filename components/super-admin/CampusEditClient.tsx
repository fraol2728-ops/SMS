"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCampus } from "@/lib/actions/super-admin";

type CampusEditClientProps = {
  campus: {
    id: string;
    name: string;
    location: string | null;
    color: string;
    isActive: boolean;
    _count: {
      users: number;
      classes: number;
      labs: number;
    };
  };
};

const COLORS = [
  { id: "blue", label: "Blue", bg: "bg-blue-600" },
  { id: "green", label: "Green", bg: "bg-green-600" },
  { id: "purple", label: "Purple", bg: "bg-purple-600" },
  { id: "red", label: "Red", bg: "bg-red-600" },
  { id: "amber", label: "Amber", bg: "bg-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-600" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-600" },
  { id: "teal", label: "Teal", bg: "bg-teal-600" },
];

export function CampusEditClient({ campus }: CampusEditClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(campus.color ?? "blue");
  const [isActive, setIsActive] = useState(campus.isActive);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("color", color);
      formData.set("isActive", String(isActive));
      const res = await updateCampus(campus.id, formData);
      if (res.success) {
        toast.success("Campus updated");
        router.push("/super-admin/campuses");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Students", value: campus._count.users },
            { label: "Classes", value: campus._count.classes },
            { label: "Labs", value: campus._count.labs },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800"
            >
              <p className="font-bold text-xl dark:text-white">{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Campus Name *</Label>
            <Input name="name" required defaultValue={campus.name} />
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input name="location" defaultValue={campus.location ?? ""} />
          </div>

          <div className="space-y-2">
            <Label>Campus Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((campusColor) => (
                <button
                  key={campusColor.id}
                  type="button"
                  onClick={() => setColor(campusColor.id)}
                  className={`h-10 w-10 rounded-xl ${campusColor.bg} transition-all ${color === campusColor.id ? "scale-110 ring-4 ring-gray-400 ring-offset-2 dark:ring-offset-gray-900" : "opacity-60 hover:opacity-100"}`}
                  title={campusColor.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4 dark:border-gray-700">
            <div>
              <p className="font-medium text-sm dark:text-white">
                Campus Active
              </p>
              <p className="text-gray-400 text-xs">
                Inactive campuses are hidden from portals
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/super-admin/campuses")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
