import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function resolveStudentUser<T extends Prisma.UserInclude>(
  clerkId: string,
  email: string | null | undefined,
  include: T,
) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include,
  });

  if (!user && email) {
    const normalizedEmail = email.toLowerCase();
    const byEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include,
    });

    if (byEmail) {
      user = await prisma.user.update({
        where: { email: normalizedEmail },
        data: { clerkId },
        include,
      });
    }
  }

  return user;
}
