import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getRedirectUrl(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status === 401
      ? "/sign-in"
      : "/unauthorized";
  }

  return "/unauthorized";
}

async function getClerkRole() {
  const { userId } = await auth();
  if (!userId) {
    throw { status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user) {
    throw { status: 401 };
  }

  return user.role;
}

export async function requireRole(roles: string[]) {
  try {
    const role = await getClerkRole();
    if (!roles.includes(role)) {
      throw { status: 403 };
    }
    return role;
  } catch (error) {
    redirect(getRedirectUrl(error));
  }
}

export async function requireAdmin() {
  try {
    return await requireRole(["ADMIN", "SUPER_ADMIN"]);
  } catch (error) {
    redirect(getRedirectUrl(error));
  }
}

export async function requireSuperAdmin() {
  try {
    return await requireRole(["SUPER_ADMIN"]);
  } catch (error) {
    redirect(getRedirectUrl(error));
  }
}

export async function requireTeacher() {
  try {
    return await requireRole(["TEACHER"]);
  } catch (error) {
    redirect(getRedirectUrl(error));
  }
}

export async function requireStudent() {
  try {
    return await requireRole(["STUDENT"]);
  } catch (error) {
    redirect(getRedirectUrl(error));
  }
}
