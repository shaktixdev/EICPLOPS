'use client'

import { useSession } from 'next-auth/react'
import { can, normalizeRole, roleLabel, type Permission } from '@/lib/roles'

export function usePermissions() {
  const { data: session, status } = useSession()
  const role = normalizeRole((session?.user as { role?: string } | undefined)?.role)

  return {
    role,
    roleLabel: roleLabel(role),
    loading: status === 'loading',
    can: (permission: Permission) => can(role, permission),
    isAdmin: role === 'admin',
    isOperator: role === 'operator',
    isGuard: role === 'guard',
  }
}
