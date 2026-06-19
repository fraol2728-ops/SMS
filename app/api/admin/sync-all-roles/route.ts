import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
