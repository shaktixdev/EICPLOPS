import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'
import { ALL_ROLES, normalizeRole, type AppRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const gate = await requirePermission('users')
    if (gate.error) return gate.error

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      users.map((u) => ({
        ...u,
        role: normalizeRole(u.role),
        createdAt: u.createdAt.toISOString().split('T')[0],
      }))
    )
  } catch (error: any) {
    console.error('GET /api/users', error)
    return NextResponse.json({ error: error.message || 'Failed to load users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('users')
    if (gate.error) return gate.error

    const body = await req.json()
    const username = String(body.username || '')
      .toLowerCase()
      .trim()
    const password = String(body.password || '')
    const name = String(body.name || '').trim()
    const role = normalizeRole(body.role || 'operator') as AppRole

    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'Email / username must be at least 3 characters' }, { status: 400 })
    }
    if (!/^[a-z0-9._@+-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Use a valid email or username (letters, numbers, . _ @ + -)' },
        { status: 400 }
      )
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (!ALL_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Role must be admin, operator, or guard' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        password: hash,
        name,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        ...user,
        role: normalizeRole(user.role),
        createdAt: user.createdAt.toISOString().split('T')[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/users', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}
