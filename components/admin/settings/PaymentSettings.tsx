"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePaymentSettings } from "@/lib/actions/settings";
import type { AdminSettingsData } from "./types";

export function PaymentSettings({ settings }: { settings: AdminSettingsData }) {
  const [loading, setLoading] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(
    settings?.paymentGracePeriodDays ?? 7,
  );
  const [certFee, setCertFee] = useState(settings?.defaultCertificateFee ?? 0);
  const [reminderDays, setReminderDays] = useState(
    settings?.paymentReminderDaysBefore ?? 3,
  );
  async function handleSave() {
    setLoading(true);
    try {
      const res = await updatePaymentSettings({
        paymentGracePeriodDays: Number(gracePeriod),
        defaultCertificateFee: Number(certFee),
        paymentReminderDaysBefore: Number(reminderDays),
      });
      res.success
        ? toast.success("Payment settings saved")
        : toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-6 rounded-xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Payment Settings
        </h2>
        <p className="text-sm text-gray-500">Configure default payment rules</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Default Currency</Label>
          <div className="flex h-10 items-center rounded-lg border bg-gray-50 px-3 text-sm text-gray-700">
            ETB — Ethiopian Birr
          </div>
          <p className="text-xs text-gray-400">Currency is fixed to ETB</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gracePeriod">Payment Grace Period (days)</Label>
          <Input
            id="gracePeriod"
            max={30}
            min={0}
            onChange={(e) => setGracePeriod(Number(e.target.value))}
            type="number"
            value={gracePeriod}
          />
          <p className="text-xs text-gray-400">
            Days after due date before marking as overdue
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="certFee">Default Certificate Fee (ETB)</Label>
          <Input
            id="certFee"
            min={0}
            onChange={(e) => setCertFee(Number(e.target.value))}
            type="number"
            value={certFee}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reminderDays">
            Payment Reminder (days before due)
          </Label>
          <Input
            id="reminderDays"
            max={30}
            min={1}
            onChange={(e) => setReminderDays(Number(e.target.value))}
            type="number"
            value={reminderDays}
          />
        </div>
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Saving..." : "Save Payment Settings"}
      </Button>
    </div>
  );
}
