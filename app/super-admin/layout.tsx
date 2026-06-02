import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/layout/SuperAdminShell";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      _count: {
        select: {
          users: { where: { role: "STUDENT" } },
        },
      },
    },
  });

  return (
    <SuperAdminShell campuses={campuses} admin={dbUser}>
      {children}
    </SuperAdminShell>
  );
}
