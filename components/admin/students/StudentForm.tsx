"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createStudent } from "@/lib/actions/admin";

type CourseOption = {
  id: string;
  title: string;
  fee: number;
};

const schedules = [
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
];

const daysOptions = ["Mon / Wed / Fri", "Tue / Thu / Sat"];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function StudentForm({
  courses,
}: {
  courses: CourseOption[];
  defaultValues?: unknown;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses[0]?.id ?? "",
  );
  const [paymentAmount, setPaymentAmount] = useState(
    String(courses[0]?.fee ?? 0),
  );
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const values = Object.fromEntries(formData.entries());
      const res = await createStudent({
        ...values,
        paymentAmount: Number(values.paymentAmount),
      });
      if (res.success) {
        toast.success("Student registered successfully");
        router.push("/admin/students");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="max-w-4xl space-y-8">
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
            <Input id="firstName" name="firstName" required type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" required type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" required type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} />
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
            <Input id="guardianName" name="guardianName" type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input id="guardianPhone" name="guardianPhone" type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input id="emergencyContact" name="emergencyContact" type="text" />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-semibold">Enrollment</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
            <select
              id="courseId"
              name="courseId"
              required
              value={selectedCourseId}
              onChange={(event) => {
                const courseId = event.target.value;
                setSelectedCourseId(courseId);
                const course = courses.find((item) => item.id === courseId);
                setPaymentAmount(String(course?.fee ?? 0));
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <select
              id="schedule"
              name="schedule"
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Days</Label>
            <select
              id="days"
              name="days"
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select days</option>
              {daysOptions.map((days) => (
                <option key={days} value={days}>
                  {days}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classType">Class Type</Label>
            <select
              id="classType"
              name="classType"
              required
              defaultValue="GROUP"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="GROUP">Group</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={todayInputValue()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              required
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          {paymentStatus === "PAID" ? (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
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
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input
              id="paymentAmount"
              name="paymentAmount"
              type="number"
              min={0}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2 border-t pt-6">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </section>

      <Button type="submit" disabled={loading || courses.length === 0}>
        {loading ? <Spinner className="mr-2" /> : null}
        Register Student
      </Button>
    </form>
  );
}
