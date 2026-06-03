"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAsset,
  updateAssetCondition,
  updateAssetDetails,
} from "@/lib/actions/inventory";
import {
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  ASSET_LOG_ACTIONS,
} from "@/lib/constants";

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-green-100 text-green-700",
  FAIR: "bg-blue-100 text-blue-700",
  DAMAGED: "bg-red-100 text-red-700",
  UNDER_REPAIR: "bg-amber-100 text-amber-700",
  MISSING: "bg-purple-100 text-purple-700",
  RETIRED: "bg-gray-100 text-gray-500",
};

const LOG_ACTION_COLORS: Record<string, string> = {
  ADDED: "bg-green-50 text-green-700",
  REPAIRED: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-red-50 text-red-700",
  MISSING: "bg-purple-50 text-purple-700",
  RETIRED: "bg-gray-50 text-gray-500",
  UPDATED: "bg-gray-50 text-gray-700",
  RETURNED: "bg-green-50 text-green-700",
};

type AssetLog = {
  id: string;
  action: string;
  note: string | null;
  createdAt: Date | string;
  user: { firstName: string; lastName: string };
};

type AssetDetailRecord = {
  id: string;
  name: string;
  category: string;
  condition: string;
  serialNumber: string | null;
  notes: string | null;
  createdAt: Date | string;
  logs: AssetLog[];
};

export function AssetDetail({
  asset,
  labId,
  basePath = "/admin/inventory",
  queryString = "",
}: {
  asset: AssetDetailRecord;
  labId: string;
  basePath?: string;
  queryString?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newCondition, setNewCondition] = useState(asset.condition);
  const [action, setAction] = useState("UPDATED");
  const [note, setNote] = useState("");
  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber ?? "");
  const [assetNotes, setAssetNotes] = useState(asset.notes ?? "");

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await updateAssetCondition(
        asset.id,
        newCondition,
        action,
        note,
      );
      if (res.success) {
        toast.success("Asset updated successfully");
        setShowUpdateForm(false);
        setNote("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("category", category);
      formData.set("serialNumber", serialNumber);
      formData.set("notes", assetNotes);
      const res = await updateAssetDetails(asset.id, formData);
      if (res.success) {
        toast.success("Asset details saved");
        setShowEditForm(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await deleteAsset(asset.id);
      if (res.success) {
        toast.success("Asset deleted");
        router.push(`${basePath}/${labId}${queryString}`);
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const categoryLabel =
    ASSET_CATEGORIES[asset.category as keyof typeof ASSET_CATEGORIES];
  const conditionLabel =
    ASSET_CONDITIONS[asset.condition as keyof typeof ASSET_CONDITIONS];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="mb-1 text-muted-foreground text-xs">Category</p>
            <p className="font-medium">{categoryLabel}</p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-xs">Condition</p>
            <span
              className={`rounded-full px-2 py-1 font-medium text-xs ${CONDITION_COLORS[asset.condition]}`}
            >
              {conditionLabel}
            </span>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-xs">Serial Number</p>
            <p className="font-mono text-sm">{asset.serialNumber ?? "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-xs">Added</p>
            <p className="text-sm">
              {new Date(asset.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        {asset.notes ? (
          <div className="mt-4 border-t pt-4">
            <p className="mb-1 text-muted-foreground text-xs">Notes</p>
            <p className="text-sm">{asset.notes}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
          <Button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            variant="outline"
            size="sm"
          >
            Update Condition
          </Button>
          <Button
            onClick={() => setShowEditForm(!showEditForm)}
            variant="outline"
            size="sm"
          >
            Edit Details
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            disabled={loading}
          >
            Delete Asset
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`${basePath}/${labId}${queryString}`}>← Back to lab</a>
          </Button>
        </div>
      </div>

      {showUpdateForm ? (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Update Asset Condition</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>New Condition *</Label>
                <select
                  value={newCondition}
                  onChange={(event) => setNewCondition(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(ASSET_CONDITIONS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Action *</Label>
                <select
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(ASSET_LOG_ACTIONS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Describe what happened or what was done..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpdateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showEditForm ? (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Edit Asset Details</h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name / Model *</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(ASSET_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={serialNumber}
                  onChange={(event) => setSerialNumber(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  value={assetNotes}
                  onChange={(event) => setAssetNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Details"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">
          Activity Log ({asset.logs.length} entries)
        </h2>
        {asset.logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {asset.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4">
                <div
                  className={`whitespace-nowrap rounded-full px-2 py-1 font-medium text-xs ${LOG_ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-700"}`}
                >
                  {ASSET_LOG_ACTIONS[
                    log.action as keyof typeof ASSET_LOG_ACTIONS
                  ] ?? log.action}
                </div>
                <div className="flex-1">
                  {log.note ? <p className="text-sm">{log.note}</p> : null}
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    by {log.user.firstName} {log.user.lastName} •{" "}
                    {new Date(log.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
