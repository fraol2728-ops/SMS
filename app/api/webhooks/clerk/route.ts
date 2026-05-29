import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.type;

    if (eventType === "user.created") {
      const { id: clerkId, email_addresses: emailAddresses } = payload.data;
      const email = emailAddresses?.[0]?.email_address;

      if (email) {
        const normalizedEmail = email.toLowerCase();
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser?.clerkId.startsWith("pending_")) {
          await prisma.user.update({
            where: { email: normalizedEmail },
            data: { clerkId },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
