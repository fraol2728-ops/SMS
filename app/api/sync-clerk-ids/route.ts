import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get Clerk user email.
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    // Find DB user by email.
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User not found in DB",
          email,
          clerkId,
        },
        { status: 404 },
      );
    }

    if (dbUser.clerkId === clerkId) {
      return NextResponse.json({
        message: "Already in sync",
        clerkId,
        email,
      });
    }

    // Update the clerkId.
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { clerkId },
    });

    return NextResponse.json({
      message: "ClerkId synced successfully",
      email,
      oldClerkId: dbUser.clerkId,
      newClerkId: clerkId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
