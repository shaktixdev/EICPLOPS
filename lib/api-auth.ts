import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { can, normalizeRole, type Permission } from '@/lib/roles'

export async function getSessionRole() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return normalizeRole((session.user as { role?: string }).role)
}

export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null, role: null }
  }
  const role = normalizeRole((session.user as { role?: string }).role)
  if (!can(role, permission)) {
    return {
      error: NextResponse.json({ error: 'Permission denied' }, { status: 403 }),
      session,
      role,
    }
  }
  return { error: null, session, role }
}
