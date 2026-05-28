import { auth } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const isRole = (value: string): value is Role => {
  return value === 'ADMIN' || value === 'TEACHER' || value === 'STUDENT'
}

export async function POST() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return NextResponse.json({ synced: false }, { status: 401 })
  }

  const metadataRole = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const role = typeof metadataRole === 'string' ? metadataRole.toUpperCase() : undefined

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  })

  if (dbUser && role && isRole(role) && dbUser.role !== role) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { role },
    })
  }

  return NextResponse.json({ synced: true })
}
