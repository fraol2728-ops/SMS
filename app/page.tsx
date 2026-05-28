import { auth } from '@clerk/nextjs/server'
import { SignInButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()

  if (userId) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

    if (role === 'ADMIN') redirect('/admin')
    if (role === 'TEACHER') redirect('/teacher')
    if (role === 'STUDENT') redirect('/student')

    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Exceed</h1>
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
      </div>
    </main>
  )
}
