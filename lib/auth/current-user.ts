import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  clerkId: string;
  role: string;
  campusId: string | null;
  firstName: string;
  lastName: string;
  email: string;
};

// React cache() deduplicates this call within a single request.
export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        role: true,
        campusId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return user;
  },
);
