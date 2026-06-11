import { auth } from "@clerk/nextjs/server";

/** Read role from session JWT claims only — matches proxy.ts */
export async function getAuthRole(): Promise<string | null> {
  const { sessionClaims } = await auth();
  
  const role = (sessionClaims?.metadata as any)?.role as string | undefined;
  
  return role || null;
}
