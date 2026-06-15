import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { HomeClient } from "@/components/home/HomeClient"

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()

  if (userId) {
    const role = (sessionClaims?.metadata as any)?.role as string | undefined

    if (role === "SUPER_ADMIN") redirect("/super-admin")
    if (role === "ADMIN") redirect("/admin")
    if (role === "TEACHER") redirect("/teacher")
    if (role === "STUDENT") redirect("/student")

    // Signed in but no role — show message instead of redirecting
    // DO NOT redirect to /unauthorized here — causes loop
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">⚙️</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Account Setup Needed
          </h1>
          <p className="text-gray-500 text-sm">
            Your account exists but no role has been assigned.
            Please contact your administrator.
          </p>
          <p className="text-xs text-gray-400 mt-4">User ID: {userId}</p>
        </div>
      </div>
    )
  }

  return <HomeClient />
}
