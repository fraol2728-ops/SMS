import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserCampusId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { campusId: true, role: true },
    });
    return user?.campusId ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        campusId: true,
        firstName: true,
        lastName: true,
      },
    });
  } catch {
    return null;
  }
}
