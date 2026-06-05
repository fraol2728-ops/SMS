import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireRole(...roles: string[]) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (!role || !roles.includes(role)) redirect("/unauthorized");
  return { userId, role };
}

export async function requireAdmin() {
  const result = await requireRole("ADMIN", "SUPER_ADMIN");
  
  // Check if admin is blocked
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: result.userId },
  });
  
  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }
  
  return result;
}

export async function requireTeacher() {
  const result = await requireRole("TEACHER");
  
  // Check if teacher is blocked
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: result.userId },
  });
  
  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }
  
  return result;
}

export async function requireStudent() {
  const result = await requireRole("STUDENT");
  
  // Check if student is blocked
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: result.userId },
  });
  
  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }
  
  return result;
}

export async function requireSuperAdmin() {
  const result = await requireRole("SUPER_ADMIN");
  
  // Check if super admin is blocked
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: result.userId },
  });
  
  if (!dbUser || !dbUser.isActive) {
    redirect("/unauthorized");
  }
  
  return result;
}
