'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ALL_ROLES, roleLabel, type AppRole } from '@/lib/roles'

interface AppUser {
  id: string
  username: string
  name: string
  role: string
  createdAt: string
}

export function UsersManager() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('operator')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users', { cache: 'no-store' })
      const body = await res.json().catch(() => ([]))
      if (!res.ok) {
        throw new Error(body.error || 'Failed to load users')
      }
      setUsers(body)
    } catch (err: any) {
      setError(err?.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers().catch(console.error)
  }, [loadUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, role }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Failed to create user')

      setName('')
      setUsername('')
      setPassword('')
      setRole('operator')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Users</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Create Admin, Operator, or Guard accounts. Admin has full access; Operator runs slips and arrivals;
          Guard can only view trucks and trips.
        </p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <label className="block space-y-1.5 lg:col-span-1">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Full name</span>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amit Sharma"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Email</span>
          <input
            className="input-field font-mono"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="e.g. operator@eicpl.com"
            required
            minLength={3}
            type="email"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Password</span>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
            minLength={6}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Role</span>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary h-[2.65rem]" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create user'}
        </button>
      </form>

      {saved && (
        <p className="text-sm font-medium text-[var(--accent-600)] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          User created
        </p>
      )}
      {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-subtle)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="text-left font-semibold py-3 px-4">Name</th>
              <th className="text-left font-semibold py-3 px-4">Email</th>
              <th className="text-left font-semibold py-3 px-4">Role</th>
              <th className="text-left font-semibold py-3 px-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-[var(--text-muted)]">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-[var(--text-muted)]">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border-color)]">
                  <td className="py-3 px-4 font-semibold">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{u.username}</td>
                  <td className="py-3 px-4">{roleLabel(u.role)}</td>
                  <td className="py-3 px-4 text-[var(--text-muted)]">{u.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
