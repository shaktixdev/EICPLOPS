'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/lib/roles'

export function RequirePermission({
  permission,
  children,
  fallbackHref = '/dashboard',
}: {
  permission: Permission
  children: React.ReactNode
  fallbackHref?: string
}) {
  const router = useRouter()
  const { can, loading } = usePermissions()

  React.useEffect(() => {
    if (!loading && !can(permission)) {
      router.replace(fallbackHref)
    }
  }, [loading, can, permission, router, fallbackHref])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-sm text-[var(--text-muted)]">
        Checking access…
      </div>
    )
  }

  if (!can(permission)) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    )
  }

  return <>{children}</>
}
