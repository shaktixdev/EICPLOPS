'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

const STORAGE_KEY = 'sidebar-open'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'false') setOpenState(false)
    if (saved === 'true') setOpenState(true)
  }, [])

  const setOpen = (next: boolean) => {
    setOpenState(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  const toggle = () => setOpen(!open)

  return (
    <SidebarContext.Provider value={{ open, toggle, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
