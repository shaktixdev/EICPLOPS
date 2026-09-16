'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Toggle Dark/Light Mode"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-slate-700" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}
