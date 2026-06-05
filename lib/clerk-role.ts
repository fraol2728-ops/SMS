import { auth, currentUser } from "@clerk/nextjs/server";

type RoleClaims = {
  metadata?: { role?: string };
  publicMetadata?: { role?: string };
  public_metadata?: { role?: string };
};

/** Read role from session JWT and Clerk user metadata (same sources as proxy.ts). */
export async function getAuthRole(): Promise<string | null> {
  const [{ sessionClaims }, user] = await Promise.all([auth(), currentUser()]);

  const claims = sessionClaims as RoleClaims | null | undefined;
  const fromClaims =
    claims?.metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.public_metadata?.role;

  const fromUser = user?.publicMetadata?.role as string | undefined;

  return fromClaims || fromUser || null;
}
