'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { useTheme } from '@/components/providers/theme-provider'
import { FormFieldsManager } from '@/components/settings/form-fields-manager'
import { UsersManager } from '@/components/settings/users-manager'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import { SystemResetPanel } from '@/components/settings/system-reset-panel'
import { DataImportPanel } from '@/components/settings/data-import-panel'
import { Toggle } from '@/components/ui/toggle'
import { RequirePermission } from '@/components/auth/require-permission'
import { usePermissions } from '@/hooks/use-permissions'
import {
  DEFAULT_OPS_SETTINGS,
  loadOpsSettings,
  saveOpsSettings,
  type OpsSettings,
} from '@/lib/ops-settings'

export default function SettingsPage() {
  const { can } = usePermissions()
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState<OpsSettings>({ ...DEFAULT_OPS_SETTINGS })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loaded = loadOpsSettings()
    setSettings(loaded)
    saveOpsSettings(loaded)
  }, [])

  const patch = <K extends keyof OpsSettings>(key: K, value: OpsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveOpsSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <RequirePermission permission="settings">
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="System Settings" subtitle="Company details, users, form fields, and console preferences" />

        <div className="px-6 pb-8 max-w-5xl space-y-5 stagger">
          <form onSubmit={handleSave} className="surface-card p-6 space-y-5 surface-card-interactive">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Company configuration</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Company name and address appear on gate dispatch slips.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Company name</span>
                <input
                  className="input-field"
                  value={settings.companyName}
                  onChange={(e) => patch('companyName', e.target.value)}
                  placeholder="e.g. Eastern India Cement"
                  required
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Company address</span>
                <textarea
                  className="input-field min-h-[88px] h-auto py-2"
                  value={settings.companyAddress}
                  onChange={(e) => patch('companyAddress', e.target.value)}
                  placeholder="Street, area, city, state, PIN"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Active gate</span>
                <select
                  className="input-field"
                  value={settings.gateId}
                  onChange={(e) => patch('gateId', e.target.value)}
                >
                  <option>Gate 1</option>
                  <option>Gate 2</option>
                  <option>Gate 3</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Terminal node ID</span>
                <input
                  className="input-field font-mono"
                  value={settings.terminalId}
                  onChange={(e) => patch('terminalId', e.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span>
                  <span className="block text-sm font-semibold">Auto-print gate slips</span>
                  <span className="block text-xs text-[var(--text-muted)]">
                    Send to thermal printer on dispatch
                  </span>
                </span>
                <Toggle
                  label={settings.autoPrint ? 'On' : 'Off'}
                  checked={settings.autoPrint}
                  onChange={(v) => patch('autoPrint', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span>
                  <span className="block text-sm font-semibold">Require meter reading on inward</span>
                  <span className="block text-xs text-[var(--text-muted)]">
                    Block arrival logging without odometer
                  </span>
                </span>
                <Toggle
                  label={settings.requireMeter ? 'On' : 'Off'}
                  checked={settings.requireMeter}
                  onChange={(v) => patch('requireMeter', v)}
                />
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-500)]/40 transition-colors text-left"
              >
                <span>
                  <span className="block text-sm font-semibold">Appearance</span>
                  <span className="block text-xs text-[var(--text-muted)]">Currently {theme} mode</span>
                </span>
                <span className="material-symbols-outlined text-[var(--text-secondary)]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save company settings
              </button>
              {saved && (
                <span className="text-sm font-medium text-[var(--accent-600)] animate-fade-in flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Saved locally
                </span>
              )}
            </div>
          </form>

          {can('users') && <UsersManager />}

          <ChangePasswordForm />

          {can('form_fields') && <FormFieldsManager />}

          {can('masters_write') && <DataImportPanel />}

          {can('delete_data') && <SystemResetPanel />}

          <div className="surface-card p-6">
            <h2 className="text-base font-semibold mb-2">Quick links</h2>
            <div className="flex flex-wrap gap-2">
              <a href="/api/export?type=trips" className="btn-ghost" download>
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export trips CSV
              </a>
              {can('invoices') && (
                <a href="/api/export?type=invoices" className="btn-ghost" download>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export invoices CSV
                </a>
              )}
              {can('create_slip') && (
                <a href="/trips/new" className="btn-ghost">
                  <span className="material-symbols-outlined text-[16px]">assignment_add</span>
                  Open new trip form
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequirePermission>
  )
}
