"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type EnrollmentData = {
  id: string;
  classType: "GROUP" | "PERSONAL" | "ONLINE";
  selectedClassId: string;
  startDate: string;
  endDate: string;
  courseFee: number;
  paymentAmount: string;
  remaining: number;
  paymentStatus: "PAID" | "PENDING";
  paymentMethod?: string;
};

type EnrollmentSectionProps = {
  classes: ClassOption[];
  enrollments: EnrollmentData[];
  onAddEnrollment: () => void;
  onRemoveEnrollment: (id: string) => void;
  onUpdateEnrollment: (id: string, updates: Partial<EnrollmentData>) => void;
  classCreateHref: string;
};

export function EnrollmentSection({
  classes,
  enrollments,
  onAddEnrollment,
  onRemoveEnrollment,
  onUpdateEnrollment,
  classCreateHref,
}: EnrollmentSectionProps) {
  const filteredClasses = (classType: "GROUP" | "PERSONAL" | "ONLINE") =>
    classes.filter((c) => c.classType === classType);

  const handleClassSelect = (enrollmentId: string, classId: string) => {
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      onUpdateEnrollment(enrollmentId, {
        selectedClassId: classId,
        startDate: selected.startDate ?? "",
        endDate: selected.endDate ?? "",
        courseFee: selected.course.fee,
        paymentAmount: String(selected.course.fee),
        remaining: 0,
        paymentStatus: "PAID",
      });
    } else {
      onUpdateEnrollment(enrollmentId, {
        selectedClassId: classId,
        startDate: "",
        endDate: "",
        courseFee: 0,
        paymentAmount: "0",
        remaining: 0,
        paymentStatus: "PENDING",
      });
    }
  };

  const handlePaymentAmountChange = (
    enrollmentId: string,
    value: string,
  ) => {
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    const paid = parseFloat(value) || 0;
    const rem = Math.max(0, enrollment.courseFee - paid);
    const newStatus = rem > 0 ? "PENDING" : "PAID";

    onUpdateEnrollment(enrollmentId, {
      paymentAmount: value,
      remaining: rem,
      paymentStatus: enrollment.paymentStatus === "PAID" && rem > 0 ? "PENDING" : enrollment.paymentStatus,
    });
  };

  return (
    <section className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Enrollments</h2>
          <p className="text-sm text-muted-foreground">
            Add one or more courses for this student
          </p>
        </div>
        <Button
          type="button"
          onClick={onAddEnrollment}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <div className="space-y-6">
        {enrollments.map((enrollment, index) => (
          <div
            key={enrollment.id}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Course {index + 1}
              </h3>
              {enrollments.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveEnrollment(enrollment.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove this enrollment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Class Type *</Label>
                <div className="flex gap-3">
                  {(["GROUP", "PERSONAL", "ONLINE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onUpdateEnrollment(enrollment.id, {
                          classType: type,
                          selectedClassId: "",
                          startDate: "",
                          endDate: "",
                          courseFee: 0,
                          paymentAmount: "0",
                          remaining: 0,
                          paymentStatus: "PENDING",
                        });
                      }}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                        enrollment.classType === type
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
                <Label htmlFor={`classId-${enrollment.id}`}>Select Class *</Label>
                <select
                  id={`classId-${enrollment.id}`}
                  name={`classId-${enrollment.id}`}
                  required
                  value={enrollment.selectedClassId}
                  onChange={(event) =>
                    handleClassSelect(enrollment.id, event.target.value)
                  }
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">
                    {filteredClasses(enrollment.classType).length === 0
                      ? `No ${enrollment.classType.toLowerCase()} classes available`
                      : "Select a class"}
                  </option>
                  {filteredClasses(enrollment.classType).map((classOption) => {
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
                {filteredClasses(enrollment.classType).length === 0 ? (
                  <p className="text-xs text-amber-600">
                    No {enrollment.classType.toLowerCase()} classes created yet.
                    <a href={classCreateHref} className="ml-1 underline">
                      Create one first
                    </a>
                  </p>
                ) : null}
              </div>

              {enrollment.selectedClassId ? (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <input
                      type="date"
                      value={enrollment.startDate}
                      readOnly
                      className="h-10 w-full cursor-not-allowed rounded-md border bg-gray-50 px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <input
                      type="date"
                      value={enrollment.endDate}
                      readOnly
                      className="h-10 w-full cursor-not-allowed rounded-md border bg-gray-50 px-3 text-sm"
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor={`paymentStatus-${enrollment.id}`}>
                  Payment Status *
                </Label>
                <select
                  id={`paymentStatus-${enrollment.id}`}
                  name={`paymentStatus-${enrollment.id}`}
                  value={enrollment.paymentStatus}
                  onChange={(event) =>
                    onUpdateEnrollment(enrollment.id, {
                      paymentStatus: event.target.value as "PAID" | "PENDING",
                    })
                  }
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PENDING">Partial / Pending</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`paymentAmount-${enrollment.id}`}>
                  Amount Paid (ETB) *
                  {enrollment.courseFee > 0 ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Course fee: ETB {enrollment.courseFee.toLocaleString()}
                    </span>
                  ) : null}
                </Label>
                <Input
                  id={`paymentAmount-${enrollment.id}`}
                  name={`paymentAmount-${enrollment.id}`}
                  type="number"
                  min={0}
                  max={enrollment.courseFee || undefined}
                  step="0.01"
                  value={enrollment.paymentAmount}
                  onChange={(event) =>
                    handlePaymentAmountChange(enrollment.id, event.target.value)
                  }
                />
              </div>

              {enrollment.paymentStatus === "PAID" ? (
                <div className="space-y-2">
                  <Label htmlFor={`paymentMethod-${enrollment.id}`}>
                    Payment Method *
                  </Label>
                  <select
                    id={`paymentMethod-${enrollment.id}`}
                    name={`paymentMethod-${enrollment.id}`}
                    defaultValue={enrollment.paymentMethod ?? "CASH"}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              ) : null}

              {enrollment.remaining > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-800">
                        Payment Remaining
                      </p>
                      <p className="text-sm text-amber-600">
                        ETB {enrollment.remaining.toLocaleString()} will be due at
                        the halfway point of the course
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      ETB {enrollment.remaining.toLocaleString()}
                    </p>
                  </div>
                  <input
                    type="hidden"
                    name={`remainingAmount-${enrollment.id}`}
                    value={enrollment.remaining}
                  />
                </div>
              ) : (
                <input
                  type="hidden"
                  name={`remainingAmount-${enrollment.id}`}
                  value={0}
                />
              )}

              {/* Hidden field for classId to submit with form */}
              <input
                type="hidden"
                name={`enrollment-${enrollment.id}-classId`}
                value={enrollment.selectedClassId}
              />
              <input
                type="hidden"
                name={`enrollment-${enrollment.id}-startDate`}
                value={enrollment.startDate}
              />
              <input
                type="hidden"
                name={`enrollment-${enrollment.id}-endDate`}
                value={enrollment.endDate}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
