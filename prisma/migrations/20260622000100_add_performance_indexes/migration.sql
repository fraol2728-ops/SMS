-- CreateIndex
CREATE INDEX "Class_campusId_idx" ON "Class"("campusId");

-- CreateIndex
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");

-- CreateIndex
CREATE INDEX "Class_courseId_idx" ON "Class"("courseId");

-- CreateIndex
CREATE INDEX "Class_status_idx" ON "Class"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_campusId_idx" ON "User"("campusId");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_scheduledFor_idx" ON "ScheduledPost"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "Enrollment_classId_status_idx" ON "Enrollment"("classId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_classId_date_idx" ON "Attendance"("classId", "date");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_enrollmentId_idx" ON "Payment"("enrollmentId");

-- CreateIndex
CREATE INDEX "PaymentRemaining_status_dueDate_idx" ON "PaymentRemaining"("status", "dueDate");

-- CreateIndex
CREATE INDEX "PaymentRemaining_enrollmentId_idx" ON "PaymentRemaining"("enrollmentId");

-- CreateIndex
CREATE INDEX "Report_receiverId_status_createdAt_idx" ON "Report"("receiverId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "StudentNotification_studentId_isRead_createdAt_idx" ON "StudentNotification"("studentId", "isRead", "createdAt");

