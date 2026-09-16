'use client'

import React from 'react'
import { Header } from '@/components/layout/header'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/use-permissions'

export default function AccountPage() {
  const { data: session } = useSession()
  const { roleLabel } = usePermissions()
  const email = session?.user?.email || '—'
  const name = session?.user?.name || '—'

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Account" subtitle="Your profile and password" />

      <div className="px-6 pb-8 max-w-3xl space-y-5">
        <div className="surface-card p-6">
          <h2 className="text-base font-semibold mb-3">Profile</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Name</dt>
              <dd className="mt-1 font-semibold text-[var(--text-primary)]">{name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</dt>
              <dd className="mt-1 font-mono text-[var(--text-primary)]">{email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Role</dt>
              <dd className="mt-1 font-semibold text-[var(--text-primary)]">{roleLabel}</dd>
            </div>
          </dl>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  )
}
