import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    console.log("[LAYOUT:admin]", {
      reason: "no-db-user",
      pathname: "/admin",
      timestamp: new Date().toISOString(),
    });
    redirect("/sign-in");
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    console.log("[LAYOUT:admin]", {
      reason: "role-not-authorized",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/admin",
      timestamp: new Date().toISOString(),
    });
    redirect("/unauthorized");
  }

  let adminSettings: any = null;
  try {
    adminSettings = await prisma.adminSettings.findUnique({
      where: { userId: user.id },
    });
    if (!adminSettings) {
      adminSettings = await prisma.adminSettings
        .create({
          data: { userId: user.id },
        })
        .catch(() => null);
    }
  } catch {
    adminSettings = null;
  }

  const colorMode = adminSettings?.colorMode ?? "system";
  const accentColor = adminSettings?.accentColor ?? "blue";

  return (
    <ThemeProvider colorMode={colorMode} accentColor={accentColor}>
      <AdminShell user={{ ...user, adminSettings }} settings={adminSettings}>
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
