import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserCampusId(): Promise<string | null> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { campusId: true, role: true },
    });

    if (user) {
      if (user.role === "SUPER_ADMIN") return null;
      return user.campusId ?? null;
    }

    // Fallback: clerkId might not match if it was pending.
    // Try finding by any pending user and update their clerkId.
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    return await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        campusId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
  } catch {
    return null;
  }
}
