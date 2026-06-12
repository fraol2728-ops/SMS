import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/layout/SuperAdminShell";
import { prisma, withRetry } from "@/lib/prisma";

const dbUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} as const;

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const claims = sessionClaims as Record<string, unknown> | undefined;
  const email = (claims?.email as string | undefined)?.toLowerCase();
  const firstName = (claims?.first_name as string | undefined) ?? "Super";
  const lastName = (claims?.last_name as string | undefined) ?? "Admin";

  let dbUser = await withRetry(() =>
    prisma.user.findUnique({
      where: { clerkId: userId },
      select: dbUserSelect,
    }),
  ).catch(() => null);

  if (!dbUser && email) {
    const byEmail = await withRetry(() =>
      prisma.user.findUnique({ where: { email } }),
    ).catch(() => null);

    if (byEmail) {
      dbUser = await withRetry(() =>
        prisma.user.update({
          where: { email },
          data: { clerkId: userId, role: "SUPER_ADMIN" },
          select: dbUserSelect,
        }),
      ).catch(() => null);
    } else {
      dbUser = await withRetry(() =>
        prisma.user.create({
          data: {
            clerkId: userId,
            firstName,
            lastName,
            email,
            role: "SUPER_ADMIN",
          },
          select: dbUserSelect,
        }),
      ).catch(() => null);
    }
  }

  if (dbUser && dbUser.role !== "SUPER_ADMIN") {
    dbUser = await withRetry(() =>
      prisma.user.update({
        where: { id: dbUser!.id },
        data: { role: "SUPER_ADMIN" },
        select: dbUserSelect,
      }),
    ).catch(() => dbUser);
  }

  if (!dbUser) redirect("/unauthorized");

  const campuses = await withRetry(() =>
    prisma.campus.findMany({
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
    }),
  ).catch(() => []);

  return (
    <SuperAdminShell campuses={campuses} admin={dbUser}>
      {children}
    </SuperAdminShell>
  );
}
