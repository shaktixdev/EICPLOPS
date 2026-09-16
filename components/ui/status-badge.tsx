import React from 'react'

type StatusType =
  | 'paid'
  | 'completed'
  | 'active'
  | 'owned'
  | 'in_transit'
  | 'pending'
  | 'sent'
  | 'warning'
  | 'hired'
  | 'maintenance'
  | 'draft'
  | 'overdue'
  | 'danger'
  | 'inactive'
  | 'archived'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = status.toLowerCase()
  const displayLabel = label || status.replace('_', ' ')

  let colorClasses = 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'

  if (['paid', 'completed', 'active', 'owned'].includes(normalized)) {
    colorClasses = 'bg-[var(--mint-soft)] text-[var(--accent-600)]'
  } else if (['in_transit', 'pending', 'sent', 'warning', 'hired'].includes(normalized)) {
    colorClasses = 'bg-[color-mix(in_srgb,var(--warning)_14%,white)] text-[var(--warning)]'
  } else if (['overdue', 'danger', 'maintenance', 'inactive'].includes(normalized)) {
    colorClasses = 'bg-[color-mix(in_srgb,var(--danger)_12%,white)] text-[var(--danger)]'
  } else if (['draft', 'archived'].includes(normalized)) {
    colorClasses = 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      <span>{displayLabel}</span>
    </span>
  )
}
