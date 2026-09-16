'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSidebar } from '@/components/layout/sidebar-context'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/lib/roles'

const MAIN_NAV: Array<{ href: string; icon: string; label: string; permission?: Permission }> = [
  { href: '/dashboard', icon: 'grid_view', label: 'Dashboard', permission: 'view_trips' },
  { href: '/trips', icon: 'assignment', label: 'Trips', permission: 'view_trips' },
  { href: '/trips/new', icon: 'add_circle', label: 'New Slip', permission: 'create_slip' },
  { href: '/invoices', icon: 'receipt_long', label: 'Invoices', permission: 'invoices' },
  { href: '/masters/trucks', icon: 'local_shipping', label: 'Fleet', permission: 'view_fleet' },
  { href: '/masters/drivers', icon: 'badge', label: 'Drivers', permission: 'view_fleet' },
  { href: '/analytics', icon: 'monitoring', label: 'Analytics', permission: 'analytics' },
]

const BOTTOM_NAV: Array<{ href: string; icon: string; label: string; permission?: Permission }> = [
  { href: '/account', icon: 'manage_accounts', label: 'Account' },
  { href: '/settings', icon: 'settings', label: 'Settings', permission: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, toggle } = useSidebar()
  const { can, roleLabel } = usePermissions()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/trips') {
      return pathname === '/trips' || (pathname.startsWith('/trips/') && !pathname.startsWith('/trips/new'))
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavButton = ({
    href,
    icon,
    label,
  }: {
    href: string
    icon: string
    label: string
  }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        title={label}
        data-active={active ? 'true' : 'false'}
        className={`nav-pill group relative flex items-center rounded-full ${
          open ? 'w-full gap-3 px-3 h-11 justify-start' : 'w-11 h-11 justify-center'
        } ${
          active
            ? 'bg-[var(--accent-600)] text-white shadow-lg shadow-[rgba(11,95,75,0.35)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-600)]'
        }`}
      >
        <span className="material-symbols-outlined text-[22px] shrink-0 transition-transform duration-150 ease-apple group-active:scale-95">
          {icon}
        </span>
        {open ? (
          <span className="text-sm font-medium truncate animate-fade-in">{label}</span>
        ) : (
          <span className="pointer-events-none absolute left-[calc(100%+10px)] px-2.5 py-1 rounded-lg bg-[var(--text-primary)] text-white text-[11px] font-semibold opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap z-50 shadow-md">
            {label}
          </span>
        )}
      </Link>
    )
  }

  const mainItems = MAIN_NAV.filter((i) => !i.permission || can(i.permission))
  const bottomItems = BOTTOM_NAV.filter((i) => !i.permission || can(i.permission))

  return (
      <aside
      className={`fixed left-4 top-4 bottom-4 z-50 flex flex-col py-4 surface-card animate-fade-in transition-all duration-300 ease-apple ${
        open ? 'w-[220px] px-3 items-stretch' : 'w-[72px] items-center px-0'
      }`}
    >
      <div className={`flex items-center mb-5 ${open ? 'justify-between gap-2' : 'flex-col gap-2'}`}>
        <Link
          href="/dashboard"
          className={`rounded-2xl bg-[var(--accent-600)] text-white flex items-center justify-center shadow-md shadow-[rgba(11,95,75,0.3)] shrink-0 ${
            open ? 'h-11 pl-2.5 pr-3 gap-2' : 'w-11 h-11'
          }`}
          title="Eastern India Cement"
        >
          <span className="material-symbols-outlined text-[22px]">warehouse</span>
          {open && (
            <span className="text-left leading-tight animate-fade-in">
              <span className="block text-[11px] font-bold tracking-tight">Eastern India</span>
              <span className="block text-[9px] font-semibold uppercase tracking-wider text-white/80">
                {roleLabel}
              </span>
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={toggle}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-600)] transition-colors shrink-0"
          title={open ? 'Collapse menu' : 'Expand menu'}
          aria-label={open ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={open}
        >
          <span className="material-symbols-outlined text-[20px]">
            {open ? 'left_panel_close' : 'left_panel_open'}
          </span>
        </button>
      </div>

      <nav className={`flex-1 flex flex-col gap-1.5 overflow-y-auto py-1 ${open ? '' : 'items-center'}`}>
        {mainItems.map((item) => (
          <NavButton key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </nav>

      <div
        className={`flex flex-col gap-1.5 pt-3 border-t border-[var(--border-color)] ${
          open ? 'items-stretch' : 'items-center w-10'
        }`}
      >
        {bottomItems.map((item) => (
          <NavButton key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Sign out"
          className={`group relative flex items-center rounded-full text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-all ${
            open ? 'w-full gap-3 px-3 h-11 justify-start' : 'w-11 h-11 justify-center'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
          {open ? (
            <span className="text-sm font-medium">Sign out</span>
          ) : (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] px-2.5 py-1 rounded-lg bg-[var(--text-primary)] text-white text-[11px] font-semibold opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap z-50 shadow-md">
              Sign out
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
