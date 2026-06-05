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

    // Only super admin can run this
    const clerkUser = await currentUser();
    const role = clerkUser?.publicMetadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users from DB that have real clerkIds
    const dbUsers = await prisma.user.findMany({
      where: {
        clerkId: { not: { startsWith: "pending_" } },
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        role: true,
        campusId: true,
      },
    });

    const clerk = await clerkClient();
    const results: Array<Record<string, unknown>> = [];

    for (const user of dbUsers) {
      try {
        const metadata: Record<string, unknown> = { role: user.role };
        if (user.role === "ADMIN" && user.campusId) {
          metadata.campusId = user.campusId;
        }

        await clerk.users.updateUser(user.clerkId, {
          publicMetadata: metadata,
        });

        results.push({ email: user.email, role: user.role, status: "success" });
      } catch (err) {
        results.push({
          email: user.email,
          role: user.role,
          status: "failed",
          error: String(err),
        });
      }
    }

    // Also find users by email for pending ones
    const pendingUsers = await prisma.user.findMany({
      where: { clerkId: { startsWith: "pending_" } },
      select: { id: true, email: true, role: true, campusId: true },
    });

    for (const user of pendingUsers) {
      try {
        const existingClerkUsers = await clerk.users.getUserList({
          emailAddress: [user.email],
        });

        if (existingClerkUsers.totalCount > 0) {
          const clerkUser = existingClerkUsers.data[0];
          const metadata: Record<string, unknown> = { role: user.role };
          if (user.role === "ADMIN" && user.campusId) {
            metadata.campusId = user.campusId;
          }

          await clerk.users.updateUser(clerkUser.id, {
            publicMetadata: metadata,
          });

          // Update DB clerkId
          await prisma.user.update({
            where: { email: user.email },
            data: { clerkId: clerkUser.id },
          });

          results.push({
            email: user.email,
            role: user.role,
            status: "synced_pending",
            clerkId: clerkUser.id,
          });
        } else {
          results.push({
            email: user.email,
            role: user.role,
            status: "not_in_clerk_yet",
          });
        }
      } catch (err) {
        results.push({
          email: user.email,
          role: user.role,
          status: "failed",
          error: String(err),
        });
      }
    }

    const successCount = results.filter(
      (r) => r.status === "success" || r.status === "synced_pending",
    ).length;
    const failCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} users. ${failCount} failed.`,
      results,
    });
  } catch (error) {
    console.error("Bulk sync error:", error);
    return NextResponse.json(
      {
        error: "Failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
