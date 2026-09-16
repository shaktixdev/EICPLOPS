'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'

const FLOW_STEPS = [
  { id: '1', label: 'Issue gate slip', hint: 'Dispatch truck with cargo & meter' },
  { id: '2', label: 'Track on road', hint: 'Follow trips until they reach site' },
  { id: '3', label: 'Log arrival', hint: 'Close trip with end meter & expenses' },
] as const

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await withTimeout(
        signIn('credentials', {
          username: username.trim(),
          password,
          redirect: false,
          callbackUrl: '/dashboard',
        }),
        20000,
        'Sign-in timed out. Check Vercel env vars and MongoDB network access, then try again.'
      )

      if (!result) {
        setError('Sign-in failed. Please try again.')
        return
      }

      if (result.error) {
        setError('Invalid email or password.')
        return
      }

      // Hard navigation so the session cookie is picked up reliably on Vercel
      window.location.assign(result.url || '/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-base)] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 10% 20%, color-mix(in srgb, var(--accent-500) 14%, transparent), transparent), radial-gradient(ellipse 40% 35% at 90% 80%, color-mix(in srgb, var(--mint) 35%, transparent), transparent)',
        }}
      />

      <div className="relative w-full max-w-[980px] min-h-[620px] rounded-[28px] overflow-hidden shadow-[var(--shadow-lg)] border border-[var(--border-color)] flex flex-col lg:flex-row bg-[var(--bg-surface)] animate-scale-in">
        <aside
          className="relative lg:w-[46%] p-7 sm:p-9 flex flex-col text-white overflow-hidden"
          style={{
            background:
              'linear-gradient(155deg, var(--accent-600) 0%, color-mix(in srgb, var(--accent-500) 85%, #0a4a3a) 48%, color-mix(in srgb, var(--mint) 55%, var(--accent-600)) 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, white 0.6px, transparent 0.7px), radial-gradient(circle at 80% 70%, white 0.6px, transparent 0.7px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div
            className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)' }}
          />
          <div
            className="absolute -left-10 bottom-20 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }}
          />

          <div className="relative flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25">
              <span className="material-symbols-outlined text-[20px]">warehouse</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Eastern India</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">Cement</p>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col justify-center py-10 lg:py-0">
            <span className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] font-semibold backdrop-blur-sm mb-4">
              Fleet Ops Console
              <span aria-hidden>🚚</span>
            </span>
            <h1 className="text-[2rem] sm:text-[2.35rem] font-bold tracking-tight leading-[1.15] max-w-[16ch]">
              Gate &amp; dispatch control
            </h1>
            <p className="mt-3 text-sm text-white/80 max-w-[34ch] leading-relaxed">
              Sign in with your company email to manage slips, arrivals, and fleet visibility.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-2.5 mt-auto">
            {FLOW_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`text-left rounded-2xl p-3 min-h-[108px] border ${
                  index === 0
                    ? 'bg-white text-[var(--text-primary)] border-white shadow-lg'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                <span
                  className={`inline-flex w-6 h-6 rounded-full text-[11px] font-bold items-center justify-center mb-2 ${
                    index === 0 ? 'bg-[var(--accent-600)] text-white' : 'bg-white/20 text-white'
                  }`}
                >
                  {index + 1}
                </span>
                <p className={`text-xs font-bold leading-snug ${index === 0 ? 'text-[var(--text-primary)]' : ''}`}>
                  {step.label}
                </p>
                <p
                  className={`text-[10px] mt-1 leading-snug ${
                    index === 0 ? 'text-[var(--text-muted)]' : 'text-white/70'
                  }`}
                >
                  {step.hint}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <section className="lg:w-[54%] bg-[var(--bg-surface)] p-7 sm:p-10 flex flex-col justify-center">
          <div className="w-full max-w-[400px] mx-auto">
            <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] tracking-tight mb-7">
              Sign in
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,white)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] text-[var(--danger)] text-xs font-medium text-center animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Email</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="input-field !pl-11 !pr-4 h-11"
                    placeholder="name@eicpl.com"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Password</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="input-field !pl-11 !pr-11 h-11"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 mt-1 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Continue'}
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>

            <p className="text-[10px] text-center text-[var(--text-muted)] mt-6 leading-relaxed">
              Authorized plant staff only. No password reset by email — change your password after login from Account.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
