import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Footer } from "@/components/shared/Footer";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      campus: true,
      adminSettings: true,
    },
  });

  if (!dbUser) redirect("/sign-in");

  const role = dbUser.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/unauthorized");

  const theme = dbUser.adminSettings?.sidebarTheme ?? "dark";

  return (
    <ThemeProvider
      colorMode={dbUser.adminSettings?.colorMode ?? "system"}
      accentColor={dbUser.adminSettings?.accentColor ?? "blue"}
    >
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <AdminSidebar theme={theme} user={dbUser} />
        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <AdminHeader user={dbUser} />
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
