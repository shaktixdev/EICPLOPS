import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/api-auth'
import { ALL_ROLES, normalizeRole, type AppRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const gate = await requirePermission('users')
    if (gate.error) return gate.error

    const body = await req.json()
    const name = body.name !== undefined ? String(body.name || '').trim() : undefined
    const username =
      body.username !== undefined
        ? String(body.username || '')
            .toLowerCase()
            .trim()
        : undefined
    const role = body.role !== undefined ? (normalizeRole(body.role) as AppRole) : undefined
    const password = body.password !== undefined ? String(body.password || '') : undefined

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    if (username !== undefined) {
      if (username.length < 3) {
        return NextResponse.json({ error: 'Email / username must be at least 3 characters' }, { status: 400 })
      }
      if (!/^[a-z0-9._@+-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Use a valid email or username (letters, numbers, . _ @ + -)' },
          { status: 400 }
        )
      }
      const clash = await prisma.user.findUnique({ where: { username } })
      if (clash && clash.id !== params.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }
    if (role !== undefined && !ALL_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Role must be admin, operator, or guard' }, { status: 400 })
    }
    if (password !== undefined && password.length > 0 && password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Don't demote/remove the last remaining admin
    const nextRole = role ?? normalizeRole(existing.role)
    if (normalizeRole(existing.role) === 'admin' && nextRole !== 'admin') {
      const adminCount = await prisma.user.count({
        where: { OR: [{ role: 'admin' }, { role: 'owner' }] },
      })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ...user,
      role: normalizeRole(user.role),
      createdAt: user.createdAt.toISOString().split('T')[0],
    })
  } catch (error: any) {
    console.error('PATCH /api/users/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const gate = await requirePermission('users')
    if (gate.error) return gate.error

    const currentId = (gate.session?.user as { id?: string } | undefined)?.id
    if (currentId && currentId === params.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (normalizeRole(existing.role) === 'admin') {
      const adminCount = await prisma.user.count({
        where: { OR: [{ role: 'admin' }, { role: 'owner' }] },
      })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 })
      }
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/users/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}
