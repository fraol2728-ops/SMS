"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addAsset } from "@/lib/actions/inventory";
import { ASSET_CATEGORIES } from "@/lib/constants";

export function AddAssetForm({
  labId,
  labName,
}: {
  labId: string;
  labName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const res = await addAsset(labId, formData);
      if (res.success) {
        toast.success("Asset added successfully");
        router.push(`/admin/inventory/${labId}`);
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <p className="text-muted-foreground text-sm">Lab: {labName}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select category</option>
            {Object.entries(ASSET_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name / Model *</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. Dell Optiplex 7090"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">
            Serial Number
            {category === "COMPUTER" ? (
              <span className="ml-2 text-amber-600 text-xs">
                (recommended for computers)
              </span>
            ) : null}
          </Label>
          <Input
            id="serialNumber"
            name="serialNumber"
            placeholder="e.g. SN123456789"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Initial Condition *</Label>
          <select
            id="condition"
            name="condition"
            required
            defaultValue="GOOD"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
            <option value="UNDER_REPAIR">Under Repair</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Any additional details about this asset..."
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Asset"}
      </Button>
    </form>
  );
}
