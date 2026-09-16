'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ALL_ROLES, roleLabel, type AppRole } from '@/lib/roles'

interface AppUser {
  id: string
  username: string
  name: string
  role: string
  createdAt: string
}

export function UsersManager() {
  const { data: session } = useSession()
  const currentUserId = (session?.user as { id?: string } | undefined)?.id

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('operator')

  const [editing, setEditing] = useState<AppUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<AppRole>('operator')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      setSaved('User created')
      setTimeout(() => setSaved(''), 2000)
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (u: AppUser) => {
    setEditing(u)
    setEditName(u.name)
    setEditUsername(u.username)
    setEditPassword('')
    setEditRole(u.role as AppRole)
    setError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError('')
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          role: editRole,
          ...(editPassword.trim() ? { password: editPassword } : {}),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Failed to update user')

      setEditing(null)
      setSaved('User updated')
      setTimeout(() => setSaved(''), 2000)
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || 'Failed to update user')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (u: AppUser) => {
    if (u.id === currentUserId) {
      setError('You cannot delete your own account')
      return
    }
    const ok = window.confirm(`Delete user ${u.username}? This cannot be undone.`)
    if (!ok) return

    setError('')
    setDeletingId(u.id)
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Failed to delete user')
      if (editing?.id === u.id) setEditing(null)
      setSaved('User deleted')
      setTimeout(() => setSaved(''), 2000)
      await loadUsers()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Users</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Create, edit, or delete Admin, Operator, and Guard accounts.
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
          {saved}
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
              <th className="text-right font-semibold py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-[var(--text-muted)]">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-[var(--text-muted)]">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border-color)]">
                  <td className="py-3 px-4 font-semibold">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-600)]">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{u.username}</td>
                  <td className="py-3 px-4">{roleLabel(u.role)}</td>
                  <td className="py-3 px-4 text-[var(--text-muted)]">{u.createdAt}</td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--mint-soft)] text-[var(--accent-600)] hover:bg-[color-mix(in_srgb,var(--mint)_45%,white)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={u.id === currentUserId || deletingId === u.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      {deletingId === u.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">Edit user</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Leave password blank to keep current</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Full name</span>
                <input
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Email</span>
                <input
                  className="input-field font-mono"
                  type="email"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">New password (optional)</span>
                <input
                  className="input-field"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  placeholder="Leave blank to keep"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Role</span>
                <select
                  className="input-field"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AppRole)}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
