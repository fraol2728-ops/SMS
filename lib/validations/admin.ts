import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  courseId: z.string().min(1, "Please select a course"),
  startDate: z.string().min(1),
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
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  classType: z.enum(["PERSONAL", "GROUP"]),
  durationWeeks: z.coerce.number().min(1),
  fee: z.coerce.number().min(0),
  isActive: z.coerce.boolean().default(true),
});

export const scheduleSchema = z.object({
  courseId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional(),
});

export const updateStudentSchema = studentSchema.partial().omit({ courseId: true, startDate: true });
