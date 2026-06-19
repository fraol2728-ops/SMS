import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export async function requireAdmin() {
  return requireRole(["ADMIN", "SUPER_ADMIN"]);
}

export async function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

export async function requireTeacher() {
  return requireRole(["TEACHER"]);
}

export async function requireStudent() {
  return requireRole(["STUDENT"]);
}
