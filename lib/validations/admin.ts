import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  registrationDate: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  classId: z.string().min(1, "Please select a class"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  remainingAmount: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD"])
    .optional(),
  paymentAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const teacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  specialty: z.string().optional(),
  specialties: z.string().optional(),
  bio: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Course name is required"),
  fee: z.coerce.number().min(0, "Fee is required"),
  durationWeeks: z.coerce.number().min(1).default(8),
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
  endDate: true,
  remainingAmount: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentAmount: true,
});

export const updateTeacherSchema = teacherSchema.partial();

export const updateClassSchema = z.object({
  courseId: z.string().min(1),
  teacherId: z.string().min(1),
  labId: z.string().optional(),
  timeSlot: z.enum([
    "SLOT_8_10",
    "SLOT_10_12",
    "SLOT_12_2",
    "SLOT_3_5",
    "SLOT_5_7",
  ]),
  days: z.enum(["MWF", "TTS"]),
  capacity: z.number().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classType: z.enum(["GROUP", "PERSONAL", "ONLINE"]).default("GROUP"),
  onlineLink: z.string().optional(),
});
