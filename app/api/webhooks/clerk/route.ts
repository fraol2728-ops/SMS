import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ClerkUserCreatedData = {
  id: string;
  email_addresses?: Array<{ email_address?: string }>;
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserCreatedData;
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Get svix headers
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
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const eventType = evt.type;
  console.log(`Webhook received: ${eventType}`);

  if (eventType === "user.created") {
    const { id: clerkId, email_addresses } = evt.data;

    const email = email_addresses?.[0]?.email_address?.toLowerCase();

    if (!email) {
      console.log("No email found in webhook payload");
      return NextResponse.json({ received: true });
    }

    console.log(`Processing new user: ${email}`);

    try {
      // Find user in our DB by email
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, clerkId: true, campusId: true },
      });

      if (!dbUser) {
        console.log(`User not found in DB for email: ${email}`);
        // User signed up without invitation — no role to assign
        return NextResponse.json({ received: true });
      }

      console.log(`Found DB user with role: ${dbUser.role}`);

      // Step 1: Update DB user's clerkId if it was pending
      if (dbUser.clerkId.startsWith("pending_") || dbUser.clerkId !== clerkId) {
        await prisma.user.update({
          where: { email },
          data: { clerkId },
        });
        console.log(`Updated clerkId for ${email}`);
      }

      // Step 2: Set role on Clerk user publicMetadata from DB
      const clerk = await clerkClient();

      const metadataToSet: Record<string, unknown> = {
        role: dbUser.role,
      };

      // Add campusId for ADMIN/STUDENT roles if applicable
      if ((dbUser.role === "ADMIN" || dbUser.role === "STUDENT") && dbUser.campusId) {
        metadataToSet.campusId = dbUser.campusId;
      }

      await clerk.users.updateUser(clerkId, {
        publicMetadata: metadataToSet,
      });

      console.log(
        `✅ Set role '${dbUser.role}' on Clerk user ${clerkId} (${email})`,
      );
    } catch (error) {
      console.error("Webhook processing error:", error);
      // Return 200 so Clerk doesn't retry — log the error instead
      return NextResponse.json({ received: true, error: String(error) });
    }
  }

  return NextResponse.json({ received: true });
}
