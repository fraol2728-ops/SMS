-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_enrollmentId_fkey";

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

