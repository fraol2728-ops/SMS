import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkUserCreatedEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address?: string }>;
  };
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkUserCreatedEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id: clerkUserId, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address?.toLowerCase();

    if (!email) {
      return NextResponse.json({ message: "No email in payload" });
    }

    // Find pre-registered user in DB by email
    const dbUser = await prisma.user
      .findUnique({
        where: { email },
        select: { id: true, role: true, clerkId: true },
      })
      .catch(() => null);

    if (!dbUser) {
      // Email not in our DB — this is an unauthorized signup
      // Delete the Clerk user immediately
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(clerkUserId);
      } catch {}

      return NextResponse.json(
        { message: "Email not authorized. Account removed." },
        { status: 200 },
      );
    }

    // User found — update clerkId and set role in Clerk
    try {
      // 1. Update DB with new clerkId
      await prisma.user.update({
        where: { email },
        data: { clerkId: clerkUserId },
      });

      // 2. Set role in Clerk publicMetadata immediately
      const clerk = await clerkClient();
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: { role: dbUser.role },
      });
    } catch (e) {
      console.error("Webhook error:", e);
      return NextResponse.json(
        { error: "Failed to sync user" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ message: "Webhook processed" });
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint active" });
}
