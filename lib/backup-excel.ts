import * as XLSX from "xlsx";

const date = (value: unknown) =>
  value ? new Date(value as string | Date).toLocaleDateString("en-GB") : "";

export function toStudentsSheet(data: any[]) {
  return data.map((s) => {
    const enrollment = s.enrollments?.[0];
    const remaining = enrollment?.paymentRemaining;
    return {
      "Student Code": s.studentCode ?? "",
      "First Name": s.user?.firstName ?? "",
      "Last Name": s.user?.lastName ?? "",
      Phone: s.user?.phone ?? "",
      Email: s.user?.email ?? "",
      Gender: s.user?.gender ?? "",
      "Date of Birth": date(s.user?.dateOfBirth),
      Address: s.user?.address ?? "",
      Telegram: s.user?.telegram ?? "",
      WhatsApp: s.user?.whatsapp ?? "",
      "Guardian Name": s.guardianName ?? "",
      "Guardian Phone": s.guardianPhone ?? "",
      Course: enrollment?.class?.course?.title ?? "",
      Class: enrollment?.class?.lab?.name ?? "",
      "Enrollment Status": enrollment?.status ?? "",
      "Payment Status": enrollment?.payments?.[0]?.status ?? "",
      "Amount Paid": enrollment?.payments?.[0]?.amount ?? 0,
      Remaining: remaining?.remainingAmount ?? 0,
      "Registration Date": date(s.registrationDate),
      Notes: s.notes ?? "",
    };
  });
}
export const toWithdrawnSheet = (data: any[]) =>
  data.map((w) => ({
    "Student Code": w.enrollment?.student?.studentCode ?? "",
    "First Name": w.enrollment?.student?.user?.firstName ?? "",
    "Last Name": w.enrollment?.student?.user?.lastName ?? "",
    Phone: w.enrollment?.student?.user?.phone ?? "",
    Course: w.enrollment?.class?.course?.title ?? "",
    Reason: w.reason ?? "",
    "Expected Return": date(w.expectedReturnDate),
    "Contact During": w.contactDuring ?? "",
    Notes: w.withdrawalNotes ?? "",
    "Start Date": date(w.startDate),
    Status: w.status ?? "",
  }));
export const toDroppedSheet = (data: any[]) =>
  data.map((e) => ({
    "Student Code": e.student?.studentCode ?? "",
    "First Name": e.student?.user?.firstName ?? "",
    "Last Name": e.student?.user?.lastName ?? "",
    Phone: e.student?.user?.phone ?? "",
    Course: e.class?.course?.title ?? "",
    Lab: e.class?.lab?.name ?? "",
    "Drop Date": date(e.updatedAt),
    "Amount Paid":
      e.payments?.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) ?? 0,
  }));
export const toCoursesSheet = (data: any[]) =>
  data.map((c) => ({
    Title: c.title ?? "",
    Description: c.description ?? "",
    "Class Type": c.classType ?? "",
    "Duration (Weeks)": c.durationWeeks ?? 0,
    "Fee (ETB)": c.fee ?? 0,
    Status: c.isActive ? "Active" : "Inactive",
    Created: date(c.createdAt),
  }));
export const toClassesSheet = (data: any[]) =>
  data.map((c) => ({
    Course: c.course?.title ?? "",
    Lab: c.lab?.name ?? "Online",
    Teacher: c.teacher?.user
      ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
      : "",
    "Time Slot": c.timeSlot ?? "",
    Days: c.days ?? "",
    Status: c.status ?? "",
    Capacity: c.capacity ?? 0,
    "Active Students": c._count?.enrollments ?? 0,
    "Start Date": date(c.startDate),
    "End Date": date(c.endDate),
    "Class Type": c.classType ?? "",
  }));
export const toTeachersSheet = (data: any[]) =>
  data.map((t) => ({
    "Teacher Code": t.teacherCode ?? "",
    "First Name": t.user?.firstName ?? "",
    "Last Name": t.user?.lastName ?? "",
    Phone: t.user?.phone ?? "",
    Email: t.user?.email ?? "",
    Gender: t.user?.gender ?? "",
    Address: t.user?.address ?? "",
    Telegram: t.user?.telegram ?? "",
    Specialties: (t.specialties ?? []).join(", "),
    Bio: t.bio ?? "",
    "Active Classes": t._count?.classes ?? 0,
  }));
export const toWaitlistSheet = (data: any[]) =>
  data.map((w) => ({
    "First Name": w.firstName ?? "",
    "Last Name": w.lastName ?? "",
    Phone: w.phone ?? "",
    Courses: (w.courses ?? []).join(", "),
    Status: w.status ?? "",
    "Applied Date": date(w.appliedDate),
    Notes: w.notes ?? "",
  }));
export const toPaymentsSheet = (data: any[]) =>
  data.map((p) => ({
    "First Name": p.user?.firstName ?? "",
    "Last Name": p.user?.lastName ?? "",
    Phone: p.user?.phone ?? "",
    Course: p.enrollment?.class?.course?.title ?? "",
    "Amount (ETB)": p.amount ?? 0,
    Method: p.method ?? "",
    Status: p.status ?? "",
    "Receipt Number": p.receiptNumber ?? "",
    Note: p.note ?? "",
    Date: date(p.createdAt),
  }));
export const toRemainingSheet = (data: any[]) =>
  data.map((r) => ({
    "Student Code": r.enrollment?.student?.studentCode ?? "",
    "First Name": r.enrollment?.student?.user?.firstName ?? "",
    "Last Name": r.enrollment?.student?.user?.lastName ?? "",
    Phone: r.enrollment?.student?.user?.phone ?? "",
    Course: r.enrollment?.class?.course?.title ?? "",
    "Original Fee": r.originalFee ?? 0,
    "Paid Amount": r.paidAmount ?? 0,
    "Remaining Amount": r.remainingAmount ?? 0,
    "Due Date": date(r.dueDate),
    Status: r.status ?? "",
    "Partial Payments": (r.partialPayments ?? [])
      .map((p: any) => `${p.amount} (${p.method})`)
      .join(", "),
  }));
export const toCertificatesSheet = (data: any[]) =>
  data.map((c) => ({
    "Student Name":
      c.manualStudentName ??
      (c.student?.user
        ? `${c.student.user.firstName} ${c.student.user.lastName}`
        : ""),
    "Amharic Name": c.fullNameAmharic ?? "",
    Course: c.course?.title ?? "",
    "Receipt Number": c.receiptNumber ?? "",
    "Payment Status": c.paymentStatus ?? "",
    "Payment Method": c.paymentMethod ?? "",
    "Is Done": c.isDone ? "Yes" : "No",
    "Is Delivered": c.isDelivered ? "Yes" : "No",
    "Issued Date": date(c.issuedAt),
    "Delivered Date": date(c.deliveredAt),
    Notes: c.notes ?? "",
  }));
export const toCocSheet = (data: any[]) =>
  data.map((cs) => ({
    "Student Code": cs.studentProfile?.studentCode ?? "",
    "Full Name": cs.fullName ?? "",
    "First Name": cs.studentProfile?.user?.firstName ?? "",
    "Last Name": cs.studentProfile?.user?.lastName ?? "",
    Phone: cs.phone ?? cs.studentProfile?.user?.phone ?? "",
    "Registration Number": cs.regNo ?? "",
    "Payment Amount": cs.paymentAmount ?? 0,
    "Payment Status": cs.paymentStatus ?? "",
    "Payment Method": cs.paymentMethod ?? "",
    "Exam Date": date(cs.examDate),
    Result: cs.result ?? "",
    Notes: cs.notes ?? "",
    Created: date(cs.createdAt),
  }));
export const toRequestsSheet = (data: any[]) =>
  data.map((r) => ({
    "First Name": r.firstName ?? "",
    "Last Name": r.lastName ?? "",
    Phone: r.phone ?? "",
    Course: r.courseName ?? "",
    Status: r.status ?? "",
    Notes: r.notes ?? "",
    Date: date(r.createdAt),
  }));
export const toHistorySheet = (data: any[]) =>
  data.map((c) => ({
    Course: c.course?.title ?? "",
    Lab: c.lab?.name ?? "Online",
    Teacher: c.teacher?.user
      ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
      : "",
    "Time Slot": c.timeSlot ?? "",
    Days: c.days ?? "",
    Students: c._count?.enrollments ?? 0,
    "Start Date": date(c.startDate),
    "End Date": date(c.endDate),
    "Last Updated": date(c.updatedAt),
  }));
export const toInventorySheet = (data: any[]) =>
  data.map((i) => ({
    Name: i.name ?? "",
    Category: i.category ?? "",
    "Serial Number": i.serialNumber ?? "",
    Lab: i.lab?.name ?? "",
    Campus: i.lab?.campus?.name ?? "",
    Condition: i.condition ?? "",
    Notes: i.notes ?? "",
    "Last Updated": date(i.updatedAt),
  }));

export const SHEET_CONVERTERS: Record<string, (data: any[]) => any[]> = {
  students: toStudentsSheet,
  withdrawn: toWithdrawnSheet,
  dropped: toDroppedSheet,
  courses: toCoursesSheet,
  classes: toClassesSheet,
  teachers: toTeachersSheet,
  waitlist: toWaitlistSheet,
  payments: toPaymentsSheet,
  remaining: toRemainingSheet,
  certificates: toCertificatesSheet,
  coc: toCocSheet,
  requests: toRequestsSheet,
  history: toHistorySheet,
  inventory: toInventorySheet,
};

export function buildWorkbook(
  sheets: { name: string; rows: any[] }[],
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const ws =
      rows.length > 0
        ? XLSX.utils.aoa_to_sheet([
            keys,
            ...rows.map((row) => keys.map((key) => row[key] ?? "")),
          ])
        : XLSX.utils.aoa_to_sheet([["No data found"]]);
    if (rows.length > 0) {
      ws["!cols"] = keys.map((k) => ({
        wch:
          Math.max(
            k.length,
            ...rows.slice(0, 20).map((r) => String(r[k] ?? "").length),
          ) + 2,
      }));
    }
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
