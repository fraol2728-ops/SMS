import { auth, currentUser } from "@clerk/nextjs/server";
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

  // Read role directly from Clerk — most reliable
  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  if (role !== "SUPER_ADMIN") {
    redirect("/unauthorized?reason=not-super-admin");
  }

  // Get or create DB user
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  // If DB user doesn't exist or has wrong role, sync it
  if (!dbUser) {
    const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        dbUser = await prisma.user.update({
          where: { email },
          data: { clerkId: userId, role: "SUPER_ADMIN" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });
      } else {
        dbUser = await prisma.user.create({
          data: {
            clerkId: userId,
            firstName: clerkUser?.firstName ?? "Super",
            lastName: clerkUser?.lastName ?? "Admin",
            email,
            role: "SUPER_ADMIN",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        });
      }
    }
  }

  if (dbUser && dbUser.role !== "SUPER_ADMIN") {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: "SUPER_ADMIN" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
  }

  if (!dbUser) redirect("/unauthorized");

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
