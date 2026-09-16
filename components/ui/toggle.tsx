'use client'

import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

/** Accessible switch — avoids native checkbox click/style issues */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${
          checked
            ? 'bg-[var(--accent-500)] border-[var(--accent-500)]'
            : 'bg-[var(--bg-subtle)] border-[var(--border-color)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
    </button>
  )
}
