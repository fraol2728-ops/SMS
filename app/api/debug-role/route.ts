import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    const user = await currentUser();

    return NextResponse.json({
      userId,
      sessionClaims,
      publicMetadata: user?.publicMetadata,
      role_from_claims: (sessionClaims as { metadata?: { role?: string } })
        ?.metadata?.role,
      role_from_user: user?.publicMetadata?.role,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
