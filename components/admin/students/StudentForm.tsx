"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AssessmentSection } from "@/components/admin/students/AssessmentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createStudent, updateStudent } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type ClassOption = {
  id: string;
  lab: { name: string } | null;
  timeSlot: string;
  days: string;
  classType: "GROUP" | "PERSONAL" | "ONLINE";
  startDate: string | null;
  endDate: string | null;
  course: { title: string; fee: number };
  teacher: { user: { firstName: string; lastName: string } };
  capacity: number;
  _count: { enrollments: number };
};

type DefaultStudentValues = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  notes?: string;
};

export function StudentForm({
  classes,
  defaultValues,
}: {
  classes: ClassOption[];
  defaultValues?: DefaultStudentValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classType, setClassType] = useState<"GROUP" | "PERSONAL" | "ONLINE">(
    "GROUP",
  );
  const [selectedClassId, setSelectedClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courseFee, setCourseFee] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [remaining, setRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const isEdit = Boolean(defaultValues?.id);
  const filteredClasses = classes.filter((c) => c.classType === classType);

  function onClassSelect(classId: string) {
    setSelectedClassId(classId);
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      setStartDate(selected.startDate ?? "");
      setEndDate(selected.endDate ?? "");
      setCourseFee(selected.course.fee);
      setPaymentAmount(String(selected.course.fee));
      setRemaining(0);
      setPaymentStatus("PAID");
    } else {
      setStartDate("");
      setEndDate("");
      setCourseFee(0);
      setPaymentAmount("0");
      setRemaining(0);
      setPaymentStatus("PENDING");
    }
  }

  function onPaymentAmountChange(value: string) {
    setPaymentAmount(value);
    const paid = parseFloat(value) || 0;
    const rem = Math.max(0, courseFee - paid);
    setRemaining(rem);
    if (rem > 0 && paymentStatus === "PAID") {
      setPaymentStatus("PENDING");
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit && defaultValues?.id) {
        const res = await updateStudent(defaultValues.id, formData);
        if (res.success) {
          toast.success("Student updated successfully");
          router.push(`/admin/students/${defaultValues.id}`);
        } else {
          toast.error(res.error);
        }
      } else {
        const values = Object.fromEntries(formData.entries());
        const res = await createStudent({
          ...values,
          paymentAmount: Number(values.paymentAmount),
          remainingAmount: Number(values.remainingAmount ?? 0),
        });
        if (res.success) {
          toast.success("Student registered successfully");
          router.push("/admin/students");
        } else {
          toast.error(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ total: number }>;
      if (ce && typeof ce.detail?.total !== "undefined") {
        onPaymentAmountChange(String(ce.detail.total));
      }
    }

    window.addEventListener("calculator-use-total", handler as EventListener);
    return () =>
      window.removeEventListener(
        "calculator-use-total",
        handler as EventListener,
      );
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="max-w-4xl space-y-8"
    >
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Personal Info</h2>
          <p className="text-sm text-muted-foreground">
            Basic contact details for the student.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              defaultValue={defaultValues?.firstName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              defaultValue={defaultValues?.lastName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              required
              defaultValue={defaultValues?.phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Student email address"
              defaultValue={defaultValues?.email ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              If no email provided, a system email will be generated
              automatically.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              defaultValue={defaultValues?.gender ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={defaultValues?.dateOfBirth?.slice(0, 10) ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={defaultValues?.address ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-base font-semibold text-muted-foreground">
          Guardian Info
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input
              id="guardianName"
              name="guardianName"
              defaultValue={defaultValues?.guardianName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input
              id="guardianPhone"
              name="guardianPhone"
              defaultValue={defaultValues?.guardianPhone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              name="emergencyContact"
              defaultValue={defaultValues?.emergencyContact ?? ""}
            />
          </div>
        </div>
      </section>

      {!isEdit ? (
        <section className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Enrollment</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Class Type *</Label>
              <div className="flex gap-3">
                {(["GROUP", "PERSONAL", "ONLINE"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setClassType(type);
                      onClassSelect("");
                    }}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      classType === type
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {type === "GROUP"
                      ? "👥 Group Class"
                      : type === "PERSONAL"
                        ? "👤 Personal Class"
                        : "🌐 Online Class"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="classId">Select Class *</Label>
              <select
                id="classId"
                name="classId"
                required
                value={selectedClassId}
                onChange={(event) => onClassSelect(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">
                  {filteredClasses.length === 0
                    ? `No ${classType.toLowerCase()} classes available`
                    : "Select a class"}
                </option>
                {filteredClasses.map((classOption) => {
                  const spotsLeft =
                    classOption.capacity - classOption._count.enrollments;
                  const timeLabel =
                    TIME_SLOTS[classOption.timeSlot as keyof typeof TIME_SLOTS];
                  const daysLabel =
                    CLASS_DAYS[classOption.days as keyof typeof CLASS_DAYS];
                  return (
                    <option
                      key={classOption.id}
                      value={classOption.id}
                      disabled={spotsLeft <= 0}
                    >
                      {classOption.lab?.name ?? "Online"} •{" "}
                      {classOption.course.title} • {timeLabel} • {daysLabel}
                      {spotsLeft <= 0
                        ? " — FULL"
                        : ` — ${spotsLeft} spots left`}
                    </option>
                  );
                })}
              </select>
              {filteredClasses.length === 0 ? (
                <p className="text-xs text-amber-600">
                  No {classType.toLowerCase()} classes created yet.
                  <a href="/admin/classes/new" className="ml-1 underline">
                    Create one first
                  </a>
                </p>
              ) : null}
            </div>

            {selectedClassId ? (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <input
                    name="startDate"
                    type="date"
                    value={startDate}
                    readOnly
                    className="h-10 w-full cursor-not-allowed rounded-md border bg-gray-50 px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <input
                    name="endDate"
                    type="date"
                    value={endDate}
                    readOnly
                    className="h-10 w-full cursor-not-allowed rounded-md border bg-gray-50 px-3 text-sm"
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status *</Label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="PAID">Paid in Full</option>
                <option value="PENDING">Partial / Pending</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">
                Amount Paid (ETB) *
                {courseFee > 0 ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Course fee: ETB {courseFee.toLocaleString()}
                  </span>
                ) : null}
              </Label>
              <Input
                id="paymentAmount"
                name="paymentAmount"
                type="number"
                min={0}
                max={courseFee || undefined}
                step="0.01"
                value={paymentAmount}
                onChange={(event) => onPaymentAmountChange(event.target.value)}
              />
            </div>

            {paymentStatus === "PAID" ? (
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <select
                  name="paymentMethod"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            ) : null}

            {remaining > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-800">
                      Payment Remaining
                    </p>
                    <p className="text-sm text-amber-600">
                      ETB {remaining.toLocaleString()} will be due at the
                      halfway point of the course
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    ETB {remaining.toLocaleString()}
                  </p>
                </div>
                <input type="hidden" name="remainingAmount" value={remaining} />
              </div>
            ) : (
              <input type="hidden" name="remainingAmount" value={0} />
            )}
          </div>
        </section>
      ) : null}

      {!isEdit ? <AssessmentSection /> : null}

      <section className="space-y-2 border-t pt-6">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </section>

      <Button
        type="submit"
        disabled={loading || (!isEdit && classes.length === 0)}
      >
        {loading ? <Spinner className="mr-2" /> : null}
        {isEdit ? "Save Changes" : "Register Student"}
      </Button>
    </form>
  );
}
