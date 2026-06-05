import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get Clerk user
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    // Find in DB by email
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

    // Update clerkId in DB
    if (dbUser.clerkId !== clerkId) {
      await prisma.user.update({
        where: { email },
        data: { clerkId },
      });
    }

    // Set role on Clerk
    const metadataToSet: Record<string, unknown> = {
      role: dbUser.role,
    };
    if ((dbUser.role === "ADMIN" || dbUser.role === "STUDENT") && dbUser.campusId) {
      metadataToSet.campusId = dbUser.campusId;
    }

    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkId, {
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
