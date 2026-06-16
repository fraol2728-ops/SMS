import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ allowed: false });
    }

    const user = await prisma.user
      .findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, role: true },
      })
      .catch(() => null);

    return NextResponse.json({
      allowed: !!user,
      role: user?.role ?? null,
    });
  } catch {
    return NextResponse.json({ allowed: false });
  }
}
