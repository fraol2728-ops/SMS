import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SuperAdminHeader } from "@/components/super-admin/layout/SuperAdminHeader";
import { SuperAdminSidebar } from "@/components/super-admin/layout/SuperAdminSidebar";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const clerkRole = clerkUser?.publicMetadata?.role as string | undefined;
  if (clerkRole !== "SUPER_ADMIN") redirect("/unauthorized");

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

  const admin = dbUser
    ? dbUser
    : {
        firstName: clerkUser?.firstName ?? "Super",
        lastName: clerkUser?.lastName ?? "Admin",
        email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
      };

  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SuperAdminSidebar campuses={campuses} admin={admin} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <SuperAdminHeader
          name={`${admin.firstName} ${admin.lastName}`}
          campuses={campuses}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
