"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPartialPayment } from "@/lib/actions/admin";

type RemainingPaymentItem = {
  id: string;
  originalFee: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  enrollment: {
    student: {
      studentCode: string | null;
      user: { firstName: string; lastName: string };
    };
    class: {
      lab: { name: string } | null;
      course: { title: string } | null;
    } | null;
  };
  partialPayments: Array<{
    id: string;
    amount: number;
    method: string;
    createdAt: Date;
  }>;
};

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysBadge(daysLeft: number) {
  if (daysLeft < 0) {
    return {
      label: `${Math.abs(daysLeft)} days overdue`,
      className: "border border-red-200 bg-red-100 text-red-700",
    };
  }
  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} days left`,
      className: "border border-amber-200 bg-amber-100 text-amber-700",
    };
  }
  return {
    label: `${daysLeft} days left`,
    className: "border border-green-200 bg-green-100 text-green-700",
  };
}

export function RemainingList({
  remainingPayments,
}: {
  remainingPayments: RemainingPaymentItem[];
}) {
  const router = useRouter();
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = remainingPayments.filter((payment) => {
    const name =
      `${payment.enrollment.student.user.firstName} ${payment.enrollment.student.user.lastName}`.toLowerCase();
    const code = payment.enrollment.student.studentCode?.toLowerCase() ?? "";
    return (
      search === "" ||
      name.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase())
    );
  });

  async function handlePayment(remainingId: string, maxAmount: number) {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed ETB ${maxAmount.toLocaleString()}`);
      return;
    }
    setLoading(true);
    try {
      const res = await recordPartialPayment(
        remainingId,
        amount,
        payMethod,
        payNote,
      );
      if (res.success) {
        toast.success("Payment recorded successfully");
        setOpenPaymentId(null);
        setPayAmount("");
        setPayNote("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (remainingPayments.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <p className="mb-3 text-4xl">🎉</p>
        <p className="text-lg font-semibold">All payments are up to date!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No students have outstanding balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or student code..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
      />

      <div className="space-y-3">
        {filtered.map((payment) => {
          const student = payment.enrollment.student;
          const user = student.user;
          const classRecord = payment.enrollment.class;
          const daysLeft = getDaysUntil(payment.dueDate);
          const badge = getDaysBadge(daysLeft);
          const isOpen = openPaymentId === payment.id;

          return (
            <div
              key={payment.id}
              className={`overflow-hidden rounded-xl border bg-white ${
                daysLeft < 0
                  ? "border-red-200"
                  : daysLeft <= 7
                    ? "border-amber-200"
                    : "border-green-200"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.studentCode}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {classRecord?.lab?.name} • {classRecord?.course?.title}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-700">
                      ETB {payment.remainingAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">remaining</p>
                    <div
                      className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Paid: ETB {payment.paidAmount.toLocaleString()}</span>
                    <span>
                      Total: ETB {payment.originalFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, (payment.paidAmount / payment.originalFee) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-blue-600">
                      {Math.round(
                        (payment.paidAmount / payment.originalFee) * 100,
                      )}
                      % paid
                    </span>
                    <span className="text-muted-foreground">
                      Due:{" "}
                      {new Date(payment.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {payment.partialPayments.length > 0 ? (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Previous payments:
                    </p>
                    <div className="space-y-1">
                      {payment.partialPayments.map((partial) => (
                        <div
                          key={partial.id}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-muted-foreground">
                            {new Date(partial.createdAt).toLocaleDateString(
                              "en-GB",
                            )}{" "}
                            • {partial.method}
                          </span>
                          <span className="font-medium text-green-700">
                            +ETB {partial.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setOpenPaymentId(isOpen ? null : payment.id)}
                    variant={isOpen ? "secondary" : "default"}
                  >
                    {isOpen ? "Cancel" : "Record Payment"}
                  </Button>
                </div>
              </div>

              {isOpen ? (
                <div className="border-t bg-gray-50 p-5">
                  <p className="mb-4 text-sm font-medium">
                    Record payment for {user.firstName} {user.lastName}
                    <span className="ml-2 text-muted-foreground">
                      (max: ETB {payment.remainingAmount.toLocaleString()})
                    </span>
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Amount (ETB) *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={payment.remainingAmount}
                        value={payAmount}
                        onChange={(event) => setPayAmount(event.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Method *</Label>
                      <select
                        value={payMethod}
                        onChange={(event) => setPayMethod(event.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Input
                        value={payNote}
                        onChange={(event) => setPayNote(event.target.value)}
                        placeholder="Any note..."
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    disabled={loading || !payAmount}
                    onClick={() =>
                      handlePayment(payment.id, payment.remainingAmount)
                    }
                  >
                    {loading ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
