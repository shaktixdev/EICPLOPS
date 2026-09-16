'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  fetchTrips,
  fetchTrucks,
  fetchDrivers,
  type TripItem,
  type TruckItem,
  type DriverItem,
} from '@/lib/client-data'
import { useTheme } from '@/components/providers/theme-provider'

interface HeaderProps {
  title?: string
  subtitle?: string
  showGreeting?: boolean
}

const TOP_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trips', label: 'Trips' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/masters/trucks', label: 'Fleet' },
]

const NOTIFICATIONS: {
  id: number
  title: string
  body: string
  time: string
  href: string
}[] = []

export function Header({ title, subtitle, showGreeting = false }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const name = session?.user?.name || 'Operator'
  const firstName = name.split(' ')[0]

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [searchTrips, setSearchTrips] = useState<TripItem[]>([])
  const [searchTrucks, setSearchTrucks] = useState<TruckItem[]>([])
  const [searchDrivers, setSearchDrivers] = useState<DriverItem[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchTrips(), fetchTrucks(), fetchDrivers()])
      .then(([t, tr, d]) => {
        setSearchTrips(t)
        setSearchTrucks(tr)
        setSearchDrivers(d)
      })
      .catch(console.error)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const trips = searchTrips
      .filter(
        (t) =>
          t.tripNumber.toLowerCase().includes(q) ||
          t.truckReg.toLowerCase().includes(q) ||
          t.driverName.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((t) => ({ type: 'Trip', label: t.tripNumber, meta: t.truckReg, href: `/trips/${t.id}` }))
    const trucks = searchTrucks
      .filter((t) => t.registrationNumber.toLowerCase().includes(q))
      .slice(0, 3)
      .map((t) => ({ type: 'Truck', label: t.registrationNumber, meta: t.ownershipType, href: '/masters/trucks' }))
    const drivers = searchDrivers
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((d) => ({ type: 'Driver', label: d.name, meta: d.phone, href: '/masters/drivers' }))
    return [...trips, ...trucks, ...drivers]
  }, [query, searchTrips, searchTrucks, searchDrivers])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotifOpen(false)
        setUserOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const linkActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/trips') return pathname.startsWith('/trips')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <header className="sticky top-0 z-40 px-2 pt-2 pb-1">
        <div className="flex items-center justify-between gap-4 h-14 px-4 rounded-3xl bg-[var(--bg-surface)]/90 backdrop-blur-xl shadow-[var(--shadow-sm)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-600)] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">warehouse</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-sm font-bold tracking-tight">Eastern India</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-600)]">
                Cement Ops
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {TOP_LINKS.map((link) => {
              const active = linkActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                    active
                      ? 'text-[var(--accent-600)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-5 h-0.5 rounded-full bg-[var(--accent-600)]" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-80 surface-card p-3 animate-scale-in z-50">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input-field mb-2"
                    placeholder="Search trip, truck, driver…"
                  />
                  <ul className="max-h-56 overflow-y-auto">
                    {results.length === 0 ? (
                      <li className="px-2 py-4 text-center text-sm text-[var(--text-muted)]">
                        {query.trim() ? 'No matches' : 'Type to search'}
                      </li>
                    ) : (
                      results.map((r) => (
                        <li key={`${r.type}-${r.label}`}>
                          <button
                            className="w-full text-left px-2 py-2 rounded-xl hover:bg-[var(--bg-subtle)] flex items-center gap-2"
                            onClick={() => {
                              setSearchOpen(false)
                              setQuery('')
                              router.push(r.href)
                            }}
                          >
                            <span className="badge-success">{r.type}</span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold truncate">{r.label}</span>
                              <span className="block text-xs text-[var(--text-muted)] truncate">{r.meta}</span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((v) => !v)
                  setUserOpen(false)
                }}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-80 surface-card overflow-hidden animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-[var(--border-color)] flex justify-between items-center">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button className="text-xs font-semibold text-[var(--accent-600)]" onClick={() => setUnread(0)}>
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {NOTIFICATIONS.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No notifications</li>
                    ) : (
                      NOTIFICATIONS.map((n) => (
                        <li key={n.id}>
                          <button
                            className="w-full text-left px-4 py-3 hover:bg-[var(--bg-subtle)] border-b border-[var(--border-color)] last:border-0"
                            onClick={() => {
                              setNotifOpen(false)
                              setUnread((u) => Math.max(0, u - 1))
                              router.push(n.href)
                            }}
                          >
                            <div className="flex justify-between gap-2">
                              <span className="text-sm font-semibold">{n.title}</span>
                              <span className="text-[10px] text-[var(--text-muted)] shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.body}</p>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen((v) => !v)
                  setNotifOpen(false)
                }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--mint-soft)] text-[var(--accent-600)] flex items-center justify-center font-bold text-sm">
                  {firstName.charAt(0)}
                </div>
                <span className="material-symbols-outlined text-[18px] text-[var(--text-muted)] hidden sm:block">
                  expand_more
                </span>
              </button>
              {userOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 surface-card overflow-hidden animate-scale-in z-50 py-1">
                  <div className="px-3 py-2 border-b border-[var(--border-color)]">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Plant Ops</p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--bg-subtle)]"
                    onClick={() => setUserOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </Link>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--bg-subtle)]"
                    onClick={() => {
                      toggleTheme()
                      setUserOpen(false)
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {(showGreeting || title) && (
        <div className="px-6 pt-4 pb-2 animate-fade-up">
          {showGreeting ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Welcome Back, {firstName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' — '}
                  {new Date(Date.now() + 60 * 86400000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <Link href="/trips/new" className="btn-outline-emerald">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Trip Slip
                </Link>
              </div>
            </div>
          ) : (
            <>
              {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
            </>
          )}
        </div>
      )}
    </>
  )
}
