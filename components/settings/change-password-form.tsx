'use client'

import React, { useState } from 'react'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Failed to update password')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Change password</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Update your login password. There is no forgot-password reset — contact an admin if you are locked out.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Current password</span>
          <input
            type={show ? 'text' : 'password'}
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">New password</span>
          <input
            type={show ? 'text' : 'password'}
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Confirm new password</span>
          <input
            type={show ? 'text' : 'password'}
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="rounded border-[var(--border-color)]"
          />
          Show passwords
        </label>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
          {saved && (
            <span className="text-sm font-medium text-[var(--accent-600)] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Password updated
            </span>
          )}
          {error && <span className="text-sm font-semibold text-rose-500">{error}</span>}
        </div>
      </form>
    </div>
  )
}
