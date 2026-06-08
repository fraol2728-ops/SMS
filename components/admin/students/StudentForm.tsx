"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AssessmentSection } from "@/components/admin/students/AssessmentSection";
import { EnrollmentSection } from "@/components/admin/students/EnrollmentSection";
import { EmailValidationInput } from "@/components/admin/students/EmailValidationInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createStudent, updateStudent } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";

type EnrollmentData = {
  id: string;
  classType: "GROUP" | "PERSONAL" | "ONLINE";
  selectedClassId: string;
  startDate: string;
  endDate: string;
  courseFee: number;
  paymentAmount: string;
  remaining: number;
  paymentStatus: "PAID" | "PARTIAL" | "PENDING";
  paymentMethod?: string;
};

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
  telegram?: string;
  whatsapp?: string;
  registrationDate?: string;
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
  defaultPersonalValues,
  redirectBasePath = "/admin/students",
  classCreateHref = "/admin/classes/new",
}: {
  classes: ClassOption[];
  defaultValues?: DefaultStudentValues;
  defaultPersonalValues?: Pick<
    DefaultStudentValues,
    "firstName" | "lastName" | "phone"
  >;
  redirectBasePath?: string;
  classCreateHref?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(defaultValues?.id);

  // Manage multiple enrollments
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([
    {
      id: "enrollment-0",
      classType: "GROUP",
      selectedClassId: "",
      startDate: "",
      endDate: "",
      courseFee: 0,
      paymentAmount: "0",
      remaining: 0,
      paymentStatus: "PENDING",
    },
  ]);

  const addEnrollment = () => {
    const newId = `enrollment-${Date.now()}`;
    setEnrollments([
      ...enrollments,
      {
        id: newId,
        classType: "GROUP",
        selectedClassId: "",
        startDate: "",
        endDate: "",
        courseFee: 0,
        paymentAmount: "0",
        remaining: 0,
        paymentStatus: "PENDING",
      },
    ]);
  };

  const removeEnrollment = (id: string) => {
    setEnrollments(enrollments.filter((e) => e.id !== id));
  };

  const updateEnrollment = (
    id: string,
    updates: Partial<EnrollmentData>,
  ) => {
    setEnrollments(
      enrollments.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  };

  // Handle calculator integration for first enrollment
  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ total: number }>;
      if (ce && typeof ce.detail?.total !== "undefined") {
        // Update the first enrollment with the calculated total
        const firstEnrollment = enrollments[0];
        if (firstEnrollment) {
          handlePaymentAmountChange(firstEnrollment.id, String(ce.detail.total));
        }
      }
    }

    window.addEventListener("calculator-use-total", handler as EventListener);
    return () =>
      window.removeEventListener(
        "calculator-use-total",
        handler as EventListener,
      );
  }, [enrollments]);

  const handlePaymentAmountChange = (enrollmentId: string, value: string) => {
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return;

    const paid = parseFloat(value) || 0;
    const rem = Math.max(0, enrollment.courseFee - paid);
    
    // Auto-determine payment status based on amount paid
    let newStatus: "PAID" | "PARTIAL" | "PENDING";
    if (paid === 0) {
      newStatus = "PENDING";
    } else if (paid >= enrollment.courseFee) {
      newStatus = "PAID";
    } else {
      newStatus = "PARTIAL";
    }

    updateEnrollment(enrollmentId, {
      paymentAmount: value,
      remaining: rem,
      paymentStatus: newStatus,
    });
  };

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit && defaultValues?.id) {
        const res = await updateStudent(defaultValues.id, formData);
        if (res.success) {
          toast.success("Student updated successfully");
          router.push(`${redirectBasePath}/${defaultValues.id}`);
        } else {
          toast.error(res.error);
        }
      } else {
        // For new students, we need to validate and prepare enrollments
        if (enrollments.length === 0 || !enrollments[0].selectedClassId) {
          toast.error("Please add at least one enrollment");
          setLoading(false);
          return;
        }

        const res = await createStudent(formData, enrollments);
        if (res.success) {
          toast.success("Student registered successfully");
          router.push(redirectBasePath);
        } else {
          toast.error(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

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
              defaultValue={
                defaultValues?.firstName ??
                defaultPersonalValues?.firstName ??
                ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              defaultValue={
                defaultValues?.lastName ?? defaultPersonalValues?.lastName ?? ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              required
              defaultValue={
                defaultValues?.phone ?? defaultPersonalValues?.phone ?? ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationDate">Registration Date</Label>
            <input
              id="registrationDate"
              name="registrationDate"
              type="date"
              defaultValue={
                defaultValues?.registrationDate?.slice(0, 10) ??
                new Date().toISOString().slice(0, 10)
              }
              className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram (optional)</Label>
            <Input
              id="telegram"
              name="telegram"
              placeholder="Phone number or @username"
              defaultValue={defaultValues?.telegram ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use phone number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              placeholder="Phone number"
              defaultValue={defaultValues?.whatsapp ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use phone number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <EmailValidationInput
              id="email"
              name="email"
              placeholder="Student email address"
              defaultValue={defaultValues?.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              defaultValue={defaultValues?.gender ?? ""}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
        <EnrollmentSection
          classes={classes}
          enrollments={enrollments}
          onAddEnrollment={addEnrollment}
          onRemoveEnrollment={removeEnrollment}
          onUpdateEnrollment={updateEnrollment}
          classCreateHref={classCreateHref}
        />
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
