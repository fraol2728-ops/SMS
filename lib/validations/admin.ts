import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  classId: z.string().min(1, "Please select a class"),
  startDate: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD"])
    .optional(),
  paymentAmount: z.number().min(0),
  notes: z.string().optional(),
});

export const teacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Course name is required"),
  fee: z.number().min(0, "Fee is required"),
  isActive: z.boolean().default(true),
});

export const scheduleSchema = z.object({
  courseId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional(),
});

export const updateStudentSchema = studentSchema.partial().omit({
  classId: true,
  startDate: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentAmount: true,
});
