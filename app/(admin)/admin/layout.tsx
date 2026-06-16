import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { prisma, withRetry } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await withRetry(() =>
    prisma.user.findUnique({
      where: { clerkId: userId },
      include: { campus: true },
    }),
  ).catch(() => null);

  if (!dbUser) redirect("/sign-in");

  if (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  let adminSettings: any = null;
  try {
    adminSettings = await prisma.adminSettings.findUnique({
      where: { userId: dbUser.id },
    });
    if (!adminSettings) {
      adminSettings = await prisma.adminSettings
        .create({
          data: { userId: dbUser.id },
        })
        .catch(() => null);
    }
  } catch {
    adminSettings = null;
  }

  const colorMode = adminSettings?.colorMode ?? "system";
  const accentColor = adminSettings?.accentColor ?? "blue";
  const userWithSettings = { ...dbUser, adminSettings };

  return (
    <ThemeProvider colorMode={colorMode} accentColor={accentColor}>
      <AdminShell user={userWithSettings} settings={adminSettings}>
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
