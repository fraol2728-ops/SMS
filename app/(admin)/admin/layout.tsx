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
  ).catch(() => null);

  if (!dbUser) {
    redirect("/sign-in");
  }

  const settings = await getAdminSettings();

  return (
    <ThemeProvider
      colorMode={
        settings?.colorMode ?? dbUser.adminSettings?.colorMode ?? "system"
      }
      accentColor={
        settings?.accentColor ?? dbUser.adminSettings?.accentColor ?? "blue"
      }
    >
      <AdminShell user={dbUser} settings={settings}>
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
