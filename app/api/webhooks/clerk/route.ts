import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses?: Array<{ email_address?: string }>;
    public_metadata?: {
      role?: string;
      campusId?: string;
    };
  };
};

type ClerkWebhookEvent = {
  type: string;
  data: unknown;
};

function isUserCreatedEvent(
  evt: ClerkWebhookEvent,
): evt is ClerkUserCreatedEvent {
  return evt.type === "user.created";
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Get headers
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

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  if (isUserCreatedEvent(evt)) {
    const { id: clerkId, email_addresses, public_metadata } = evt.data;

    const email = email_addresses?.[0]?.email_address?.toLowerCase();
    const role = public_metadata?.role as string | undefined;
    const campusId = public_metadata?.campusId as string | undefined;

    if (!email) {
      return NextResponse.json({ received: true });
    }

    try {
      // Find user in DB by email (was created when admin registered them)
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser?.clerkId.startsWith("pending_")) {
        // Update with real Clerk ID
        await prisma.user.update({
          where: { email },
          data: { clerkId },
        });
      } else if (!existingUser && role) {
        // User signed up but wasn't pre-registered —
        // this shouldn't happen in our flow but handle it gracefully
        console.log(`Unknown user signed up: ${email}`);
      }

      // Make sure the role is set in Clerk publicMetadata
      // (invitation metadata should already be there, but ensure it)
      if (role) {
        const clerk = await clerkClient();
        await clerk.users.updateUser(clerkId, {
          publicMetadata: {
            role,
            ...(campusId ? { campusId } : {}),
          },
        });
      }
    } catch (error) {
      console.error("Webhook DB sync error:", error);
    }
  }

  return NextResponse.json({ received: true });
}
