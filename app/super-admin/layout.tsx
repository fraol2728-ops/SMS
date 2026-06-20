import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/layout/SuperAdminShell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma, withRetry } from "@/lib/prisma";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    console.log("[LAYOUT:super-admin]", {
      reason: "no-db-user",
      pathname: "/super-admin",
      timestamp: new Date().toISOString(),
    });
    redirect("/sign-in");
  }
  if (user.role !== "SUPER_ADMIN") {
    console.log("[LAYOUT:super-admin]", {
      reason: "role-not-authorized",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/super-admin",
      timestamp: new Date().toISOString(),
    });
    redirect("/unauthorized");
  }

  // NOTE: This layout NO LONGER creates or promotes users.
  // Super admin accounts must be created explicitly through an admin action,
  // seed script, or controlled process — never automatically from rendering.

  const campuses = await withRetry(() =>
    prisma.campus.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { users: { where: { role: "STUDENT" } } },
        },
      },
    }),
  ).catch(() => []);

  return (
    <SuperAdminShell campuses={campuses} admin={user}>
      {children}
    </SuperAdminShell>
  );
}
