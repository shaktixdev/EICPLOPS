'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Soft Apple-style enter animation on each App Router navigation */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-shell">
      {children}
    </div>
  )
}

/** Thin top progress pulse while the next page mounts */
export function RouteProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(true)
    const done = window.setTimeout(() => setActive(false), 300)
    return () => window.clearTimeout(done)
  }, [pathname])

  return (
    <div
      className={`route-progress ${active ? 'route-progress--active' : ''}`}
      aria-hidden
    />
  )
}
