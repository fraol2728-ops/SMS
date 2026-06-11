import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, clerkId: true },
  });

  if (!dbUser) {
    return NextResponse.json({ synced: false }, { status: 404 });
  }

  if (dbUser.clerkId.startsWith("pending_")) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: userId },
    });
  }

  return NextResponse.json({ synced: true, role: dbUser.role });
}
