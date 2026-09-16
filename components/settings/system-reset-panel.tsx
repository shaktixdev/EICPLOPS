'use client'

import React, { useState } from 'react'
import { signOut } from 'next-auth/react'
import { resetOpsSettings } from '@/lib/ops-settings'
import { resetTripFormFields } from '@/lib/form-fields'

export function SystemResetPanel() {
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm, password }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Reset failed')

      // Restore local defaults (company settings + form fields)
      resetOpsSettings()
      resetTripFormFields()

      await signOut({ callbackUrl: '/login' })
    } catch (err: any) {
      setError(err?.message || 'Reset failed')
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-6 space-y-4 border border-rose-200/80 bg-rose-50/40">
      <div>
        <h2 className="text-base font-semibold text-rose-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">restart_alt</span>
          System &amp; data reset
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Permanently deletes all trips, invoices, advances, ledger entries, trucks, drivers, and
          operators. Restores default sample fleet and a single admin account (
          <span className="font-mono">Admin@EICPL.com</span>). Local company settings and form fields
          return to defaults. You will be signed out.
        </p>
      </div>

      <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc pl-5">
        <li>This cannot be undone</li>
        <li>Type <span className="font-mono font-semibold">RESET</span> to confirm</li>
        <li>Enter your current admin password</li>
      </ul>

      <form onSubmit={handleReset} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Confirmation</span>
          <input
            className="input-field font-mono"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.toUpperCase())}
            placeholder="Type RESET"
            required
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Admin password</span>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || confirm !== 'RESET'}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            {loading ? 'Resetting…' : 'Reset system to defaults'}
          </button>
          {error && <span className="text-sm font-semibold text-rose-600">{error}</span>}
        </div>
      </form>
    </div>
  )
}
