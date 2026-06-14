"use server";

import { prisma } from "@/lib/prisma";

const POSITIVE_OPTIONS = [
  "Explains clearly and patiently",
  "Always available to answer questions",
  "Makes the class enjoyable",
  "Arrives on time",
  "Gives helpful feedback on my work",
];

const NEGATIVE_OPTIONS = [
  "Needs to slow down",
  "Needs to give more attention to students",
  "Sometimes hard to understand",
];

export type TeacherPerformance = {
  totalScore: number;
  grade: "Excellent" | "Good" | "Average" | "Needs Improvement";
  gradeColor: "green" | "blue" | "amber" | "red";
  components: {
    feedbackRating: {
      score: number;
      maxScore: 40;
      avgRating: number;
      totalRatings: number;
    };
    positiveFeedback: {
      score: number;
      maxScore: 30;
      positiveCount: number;
      totalCount: number;
      topPositives: { label: string; count: number }[];
      topNegatives: { label: string; count: number }[];
    };
    attendance: {
      score: number;
      maxScore: 20;
      avgAttendanceRate: number;
      totalSessions: number;
    };
    retention: {
      score: number;
      maxScore: 10;
      activeStudents: number;
      totalEnrolled: number;
      retentionRate: number;
    };
  };
  totalFeedbackCount: number;
  totalStudents: number;
  totalClasses: number;
  hasData: boolean;
  trend: { month: string; avgRating: number }[];
};

function gradeFor(
  score: number,
): Pick<TeacherPerformance, "grade" | "gradeColor"> {
  if (score >= 85) return { grade: "Excellent", gradeColor: "green" };
  if (score >= 70) return { grade: "Good", gradeColor: "blue" };
  if (score >= 50) return { grade: "Average", gradeColor: "amber" };
  return { grade: "Needs Improvement", gradeColor: "red" };
}

function countOptions(
  feedbacks: { teacherFeedback: string[] }[],
  options: string[],
) {
  return options
    .map((label) => ({
      label,
      count: feedbacks.filter((f) => f.teacherFeedback.includes(label)).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export async function getTeacherPerformance(
  teacherProfileId: string,
): Promise<TeacherPerformance> {
  const [classes, feedbacks, attendanceStats, enrollments] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacherProfileId, isActive: true },
      select: { id: true },
    }),
    prisma.studentFeedback.findMany({
      where: { class: { teacherId: teacherProfileId } },
      select: {
        rating: true,
        ratedAt: true,
        createdAt: true,
        teacherFeedback: true,
      },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { class: { teacherId: teacherProfileId } },
      _count: true,
    }),
    prisma.enrollment.findMany({
      where: { class: { teacherId: teacherProfileId } },
      select: { id: true, status: true, studentId: true },
    }),
  ]);

  const rated = feedbacks.filter((f) => typeof f.rating === "number");
  const avgRating = rated.length
    ? rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length
    : 0;
  const feedbackRatingScore = Math.round((avgRating / 5) * 40);

  const positiveCount = feedbacks.reduce(
    (sum, f) =>
      sum +
      f.teacherFeedback.filter((v) => POSITIVE_OPTIONS.includes(v)).length,
    0,
  );
  const negativeCount = feedbacks.reduce(
    (sum, f) =>
      sum +
      f.teacherFeedback.filter((v) => NEGATIVE_OPTIONS.includes(v)).length,
    0,
  );
  const totalFeedbackSelections = positiveCount + negativeCount;
  const positiveFeedbackScore = totalFeedbackSelections
    ? Math.round((positiveCount / totalFeedbackSelections) * 30)
    : 0;

  const present =
    attendanceStats.find((a) => a.status === "PRESENT")?._count ?? 0;
  const late = attendanceStats.find((a) => a.status === "LATE")?._count ?? 0;
  const totalSessions = attendanceStats.reduce((sum, a) => sum + a._count, 0);
  const avgAttendanceRate = totalSessions
    ? Math.round(((present + late * 0.5) / totalSessions) * 100)
    : 0;
  const attendanceScore = Math.round((avgAttendanceRate / 100) * 20);

  const uniqueStudents = new Set(enrollments.map((e) => e.studentId)).size;
  const activeStudents = new Set(
    enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.studentId),
  ).size;
  const retentionRate = uniqueStudents
    ? Math.round((activeStudents / uniqueStudents) * 100)
    : 0;
  const retentionScore = Math.round((retentionRate / 100) * 10);

  const totalScore =
    feedbackRatingScore +
    positiveFeedbackScore +
    attendanceScore +
    retentionScore;
  const trend = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const monthFeedbacks = rated.filter((f) => {
      const d = f.ratedAt ?? f.createdAt;
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth()
      );
    });
    return {
      month: date.toLocaleString("en-US", { month: "short" }),
      avgRating: monthFeedbacks.length
        ? Number(
            (
              monthFeedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) /
              monthFeedbacks.length
            ).toFixed(1),
          )
        : 0,
    };
  });

  return {
    totalScore,
    ...gradeFor(totalScore),
    components: {
      feedbackRating: {
        score: feedbackRatingScore,
        maxScore: 40,
        avgRating: Number(avgRating.toFixed(1)),
        totalRatings: rated.length,
      },
      positiveFeedback: {
        score: positiveFeedbackScore,
        maxScore: 30,
        positiveCount,
        totalCount: totalFeedbackSelections,
        topPositives: countOptions(feedbacks, POSITIVE_OPTIONS),
        topNegatives: countOptions(feedbacks, NEGATIVE_OPTIONS),
      },
      attendance: {
        score: attendanceScore,
        maxScore: 20,
        avgAttendanceRate,
        totalSessions,
      },
      retention: {
        score: retentionScore,
        maxScore: 10,
        activeStudents,
        totalEnrolled: uniqueStudents,
        retentionRate,
      },
    },
    totalFeedbackCount: feedbacks.length,
    totalStudents: uniqueStudents,
    totalClasses: classes.length,
    hasData: feedbacks.length > 0,
    trend,
  };
}

export async function getTopPerformingTeacher(campusId?: string) {
  const teachers = await prisma.teacherProfile.findMany({
    where: campusId ? { user: { campusId } } : undefined,
    include: { user: true },
  });
  const scored = await Promise.all(
    teachers.map(async (teacher) => ({
      teacher,
      performance: await getTeacherPerformance(teacher.id),
    })),
  );
  return (
    scored
      .filter((item) => item.performance.hasData)
      .sort((a, b) => b.performance.totalScore - a.performance.totalScore)[0] ??
    null
  );
}
