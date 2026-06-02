"use client";

import { useState } from "react";
import { COCForm } from "@/components/admin/coc/COCForm";
import { Button } from "@/components/ui/button";

export function AddCOCModal({
  studentProfileId,
  studentName,
  phone,
  gender,
}: {
  studentProfileId: string;
  studentName: string;
  phone?: string | null;
  gender?: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
        onClick={() => setOpen(true)}
      >
        📋 Add COC
      </Button>
    );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold dark:text-white">Add to COC List</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <COCForm
            defaultValues={{
              fullName: studentName,
              phone: phone ?? "",
              gender: gender ?? "",
            }}
            studentProfileId={studentProfileId}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
