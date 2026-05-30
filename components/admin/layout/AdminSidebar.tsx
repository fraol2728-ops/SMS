import { auth } from "@clerk/nextjs/server";
import { AdminSidebarClient } from "@/components/admin/layout/AdminSidebarClient";
import { prisma } from "@/lib/prisma";

async function CampusIndicator() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, campus: { select: { name: true } } },
  });

  return (
    <div className="mb-2 rounded-lg bg-blue-50 px-3 py-2">
      <p className="text-xs font-medium text-blue-600">
        {user?.role === "SUPER_ADMIN"
          ? "🌐 All Campuses"
          : `📍 ${user?.campus?.name ?? "Campus"}`}
      </p>
    </div>
  );
}

export function AdminSidebar() {
  return <AdminSidebarClient campusIndicator={<CampusIndicator />} />;
}
