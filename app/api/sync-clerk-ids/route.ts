import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(user.clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, clerkId: true, campusId: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User not found in database",
          email,
          suggestion: "Ask your administrator to register you first",
        },
        { status: 404 },
      );
    }

    if (dbUser.clerkId !== user.clerkId) {
      await prisma.user.update({
        where: { email },
        data: { clerkId: user.clerkId },
      });
    }

    const metadataToSet: Record<string, unknown> = {
      role: dbUser.role,
    };
    if (
      (dbUser.role === "ADMIN" || dbUser.role === "STUDENT") &&
      dbUser.campusId
    ) {
      metadataToSet.campusId = dbUser.campusId;
    }

    await clerk.users.updateUser(user.clerkId, {
      publicMetadata: metadataToSet,
    });

    return NextResponse.json({
      success: true,
      message: `Role '${dbUser.role}' has been set on your account.`,
      email,
      role: dbUser.role,
      instruction:
        "Please sign out and sign back in for the changes to take effect.",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
