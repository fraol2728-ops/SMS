import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getAdminSettings } from "@/lib/actions/settings";
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
      include: {
        campus: true,
        adminSettings: true,
      },
    }),
  ).catch(async () => {
    return prisma.user.findUnique({
      where: { clerkId: userId },
      include: { campus: true },
    });
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const settings = await getAdminSettings();
  const sidebarTheme = (dbUser as any).adminSettings?.sidebarTheme ?? "dark";
  const colorMode = (dbUser as any).adminSettings?.colorMode ?? "system";
  const accentColor = (dbUser as any).adminSettings?.accentColor ?? "blue";

  return (
    <ThemeProvider
      colorMode={settings?.colorMode ?? colorMode}
      accentColor={settings?.accentColor ?? accentColor}
    >
      <AdminShell user={dbUser} settings={settings}>
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
