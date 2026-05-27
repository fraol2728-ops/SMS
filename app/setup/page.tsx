'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SetupPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
    setLoading(true)
    await user?.update({
      unsafeMetadata: { role },
    })
    await user?.reload()
    router.push(role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/student')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Welcome to Exceed</h1>
      <p className="text-muted-foreground">Select your role to continue</p>
      <div className="flex gap-4">
        <button
          onClick={() => setRole('ADMIN')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Admin
        </button>
        <button
          onClick={() => setRole('TEACHER')}
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Teacher
        </button>
        <button
          onClick={() => setRole('STUDENT')}
          disabled={loading}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Student
        </button>
      </div>
    </div>
  )
}
