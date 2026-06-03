import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireRole(...roles: string[]) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (!role || !roles.includes(role)) redirect("/unauthorized");
  return { userId, role };
}

export async function requireAdmin() {
  return requireRole("ADMIN", "SUPER_ADMIN");
}

export async function requireTeacher() {
  return requireRole("TEACHER");
}

export async function requireStudent() {
  return requireRole("STUDENT");
}

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}
