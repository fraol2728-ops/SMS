export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function StudentProfilePage() {
  await requireStudent();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      studentProfile: { include: { assessment: true } },
      campus: true,
    },
  });

  if (!student) redirect("/sign-in");
  const profile = student.studentProfile;
  const assessment = profile?.assessment;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Your personal information</p>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-black">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-blue-100">{profile?.studentCode}</p>
            <span className="inline-block mt-1.5 text-xs bg-white/20 px-3 py-1 rounded-full">
              Student • {student.campus?.name}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Email",
              value: student.email.includes("@exceed.local")
                ? "—"
                : student.email,
            },
            { label: "Phone", value: student.phone ?? "—" },
            { label: "Gender", value: student.gender ?? "—" },
            { label: "Address", value: student.address ?? "—" },
            { label: "Telegram", value: student.telegram ?? "—" },
            { label: "WhatsApp", value: student.whatsapp ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-semibold text-gray-900 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {(profile?.guardianName || profile?.guardianPhone) && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Guardian Information</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Guardian Name", value: profile.guardianName ?? "—" },
              { label: "Guardian Phone", value: profile.guardianPhone ?? "—" },
              {
                label: "Emergency Contact",
                value: profile.emergencyContact ?? "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="font-semibold text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Your Assessment</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Computer Knowledge",
                value:
                  assessment.hasBasicComputerKnowledge === true
                    ? "✅ Yes"
                    : assessment.hasBasicComputerKnowledge === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Active Email",
                value:
                  assessment.hasActiveEmail === true
                    ? "✅ Yes"
                    : assessment.hasActiveEmail === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Has Device",
                value:
                  assessment.hasDevice === true
                    ? "✅ Yes"
                    : assessment.hasDevice === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Internet Access",
                value:
                  assessment.hasInternetConnection === true
                    ? "✅ Yes"
                    : assessment.hasInternetConnection === false
                      ? "❌ No"
                      : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
            {assessment.socialMediaPlatforms?.length > 0 && (
              <div className="col-span-2 bg-gray-50 rounded-2xl p-3">
                <p className="text-xs text-gray-400 mb-2">Social Media Used</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.socialMediaPlatforms.map((p) => (
                    <span
                      key={p}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-sm text-amber-800 font-medium">
          ℹ️ Profile is managed by your administrator
        </p>
        <p className="text-xs text-amber-600 mt-1">
          To update your information, please contact your campus admin.
        </p>
      </div>
    </div>
  );
}
