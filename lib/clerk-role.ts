import { auth } from '@clerk/nextjs/server'

export async function getAuthRole(): Promise<string | undefined> {
  try {
    const { sessionClaims } = await auth()
    return (sessionClaims?.metadata as any)?.role as string | undefined
  } catch {
    return undefined
  }
}
