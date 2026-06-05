"use client";

import {
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMaterial, deleteMaterial } from "@/lib/actions/teacher";
import type { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

const MATERIAL_TYPES = [
  { id: "LINK", label: "Link", icon: Link2 },
  { id: "PDF", label: "PDF", icon: FileText },
  { id: "DOCUMENT", label: "Document", icon: File },
  { id: "OTHER", label: "Other", icon: FolderOpen },
];

const timeShort: Record<keyof typeof TIME_SLOTS, string> = {
  SLOT_8_10: "8-10",
  SLOT_10_12: "10-12",
  SLOT_12_2: "12-2",
  SLOT_3_5: "3-5",
  SLOT_5_7: "5-7",
};

const daysShort: Record<keyof typeof CLASS_DAYS, string> = {
  MWF: "M/W/F",
  TTS: "T/T/S",
};

type Material = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  createdAt: string | number | Date;
  url: string;
};

type TeacherClass = {
  id: string;
  classType: string;
  timeSlot: string;
  days: string;
  course: { title: string };
  materials?: Material[] | null;
};

export function MaterialsManager({
  classes,
  teacherId,
}: {
  classes: TeacherClass[];
  teacherId: string;
}) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("LINK");

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("classId", selectedClassId);
      formData.set("type", type);
      formData.set("teacherId", teacherId);
      const res = await addMaterial(formData);
      if (res.success) {
        toast.success("Material added successfully");
        setShowForm(false);
        router.refresh();
        e.currentTarget.reset();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    const res = await deleteMaterial(id);
    if (res.success) {
      toast.success("Material removed");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-5">
      {classes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {classes.map((c) => {
            const label =
              c.classType === "ONLINE"
                ? `${c.course.title} — Online`
                : `${c.course.title} — ${
                    timeShort[c.timeSlot as keyof typeof TIME_SLOTS] ??
                    c.timeSlot
                  } ${daysShort[c.days as keyof typeof CLASS_DAYS] ?? c.days}`;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClassId(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedClassId === c.id
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedClass?.materials?.length ?? 0} material
          {(selectedClass?.materials?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
          size="sm"
        >
          <Plus size={14} />
          Add Material
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-5">
          <h3 className="font-semibold dark:text-white mb-4">
            Add New Material
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2 flex-wrap">
                {MATERIAL_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      type === t.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                name="title"
                required
                placeholder="e.g. Week 1 Lecture Notes"
              />
            </div>
            {type === "LINK" ? (
              <div className="space-y-1.5">
                <Label>URL / Link *</Label>
                <Input
                  name="url"
                  required
                  placeholder="https://..."
                  type="url"
                />
                <p className="text-xs text-gray-400">
                  Paste any website link or resource URL
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>File Link *</Label>
                  <Input
                    name="url"
                    required
                    placeholder="Paste Google Drive or Dropbox share link..."
                    type="url"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    📁 How to share a {type === "PDF" ? "PDF" : "file"}:
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>
                      Upload your {type === "PDF" ? "PDF" : "file"} to Google
                      Drive
                    </li>
                    <li>
                      Right-click the file → "Share" → "Anyone with the link can
                      view"
                    </li>
                    <li>Copy the link and paste it above</li>
                  </ol>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input name="description" placeholder="Brief description..." />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Material"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {(selectedClass?.materials?.length ?? 0) === 0 ? (
        <div className="bg-white dark:bg-gray-900 border dark:border-dashed dark:border-gray-700 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-sm">No materials added yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Add links, PDFs, or documents for your students
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedClass?.materials?.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Link2 size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold dark:text-white text-sm truncate">
                  {m.title}
                </p>
                {m.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {m.description}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {m.type} • {new Date(m.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  <button
                    type="button"
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  >
                    <ExternalLink size={15} />
                  </button>
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
