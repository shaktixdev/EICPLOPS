'use client'

import React, { useEffect, useState } from 'react'
import {
  FormFieldConfig,
  FormFieldSection,
  FormFieldType,
  SECTION_LABELS,
  createCustomField,
  loadTripFormFields,
  resetTripFormFields,
  saveTripFormFields,
} from '@/lib/form-fields'
import { Toggle } from '@/components/ui/toggle'

const SECTIONS: FormFieldSection[] = ['route', 'physical', 'finance', 'custom']

export function FormFieldsManager() {
  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [saved, setSaved] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<FormFieldType>('text')
  const [newSection, setNewSection] = useState<FormFieldSection>('custom')
  const [newRequired, setNewRequired] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFields(loadTripFormFields())
  }, [])

  const persist = (next: FormFieldConfig[]) => {
    setFields(next)
    saveTripFormFields(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  const updateField = (id: string, patch: Partial<FormFieldConfig>) => {
    setFields((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
      saveTripFormFields(next)
      return next
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
    setError('')
  }

  const moveField = (id: string, direction: -1 | 1) => {
    setFields((prev) => {
      const target = prev.find((f) => f.id === id)
      if (!target) return prev
      const sectionList = prev
        .filter((f) => f.section === target.section)
        .sort((a, b) => a.order - b.order)
      const idx = sectionList.findIndex((f) => f.id === id)
      const swapIdx = idx + direction
      if (idx < 0 || swapIdx < 0 || swapIdx >= sectionList.length) return prev
      const a = sectionList[idx]
      const b = sectionList[swapIdx]
      const next = prev.map((f) => {
        if (f.id === a.id) return { ...f, order: b.order }
        if (f.id === b.id) return { ...f, order: a.order }
        return f
      })
      saveTripFormFields(next)
      return next.sort((x, y) => x.order - y.order)
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  const removeField = (id: string) => {
    const target = fields.find((f) => f.id === id)
    if (!target || target.builtin) {
      setError('Built-in fields cannot be deleted. Disable them instead.')
      return
    }
    const next = fields.filter((f) => f.id !== id)
    persist(next)
    setError('')
  }

  const addField = () => {
    if (!newLabel.trim()) {
      setError('Enter a label for the new field.')
      return
    }
    const field = createCustomField({
      label: newLabel,
      type: newType,
      section: newSection,
      required: newRequired,
    })
    persist([...fields, field])
    setNewLabel('')
    setNewRequired(false)
    setError('')
  }

  const handleSave = () => {
    saveTripFormFields(fields)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const defaults = resetTripFormFields()
    setFields(defaults || loadTripFormFields())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const bySection = (section: FormFieldSection) =>
    fields.filter((f) => f.section === section).sort((a, b) => a.order - b.order)

  return (
    <div className="surface-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Trip form fields</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Toggle Required / Enabled — changes save instantly and apply on New Gate Slip.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleReset} className="btn-ghost">
            Reset defaults
          </button>
          <button type="button" onClick={handleSave} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save fields
          </button>
        </div>
      </div>

      {saved && (
        <p className="text-sm font-medium text-[var(--accent-600)] animate-fade-in flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Form field config saved
        </p>
      )}
      {error && <p className="text-sm text-[var(--danger)] animate-fade-in">{error}</p>}

      {SECTIONS.map((section) => {
        const sectionFields = bySection(section)
        if (section === 'custom' && sectionFields.length === 0) return null
        return (
          <div key={section} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-600)]">
              {SECTION_LABELS[section]}
            </h3>
            <div className="space-y-2">
              {sectionFields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] grid grid-cols-1 lg:grid-cols-12 gap-3 items-start ${
                    !field.enabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="lg:col-span-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                      {field.builtin ? 'Built-in' : 'Custom'} · {field.key}
                    </span>
                    <input
                      className="input-field"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                    />
                  </div>
                  <div className="lg:col-span-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                      Placeholder
                    </span>
                    <input
                      className="input-field"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Type</span>
                    <select
                      className="input-field"
                      value={field.type}
                      disabled={field.builtin}
                      onChange={(e) =>
                        updateField(field.id, { type: e.target.value as FormFieldType })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="textarea">Textarea</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3 flex flex-wrap items-center gap-3 pt-5">
                    <Toggle
                      label="Required"
                      checked={Boolean(field.required)}
                      onChange={(next) => updateField(field.id, { required: next })}
                    />
                    <Toggle
                      label="Enabled"
                      checked={Boolean(field.enabled)}
                      onChange={(next) => updateField(field.id, { enabled: next })}
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => moveField(field.id, -1)}
                      title="Move up"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => moveField(field.id, 1)}
                      title="Move down"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </button>
                    {!field.builtin && (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-100"
                        onClick={() => removeField(field.id)}
                        title="Delete custom field"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
        <h3 className="text-sm font-semibold">Add new field</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          <input
            className="input-field lg:col-span-2"
            placeholder="Field label (e.g. Seal number)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <select
            className="input-field"
            value={newType}
            onChange={(e) => setNewType(e.target.value as FormFieldType)}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="textarea">Textarea</option>
          </select>
          <select
            className="input-field"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value as FormFieldSection)}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s]}
              </option>
            ))}
          </select>
          <Toggle label="Required" checked={newRequired} onChange={setNewRequired} />
        </div>
        <button type="button" onClick={addField} className="btn-outline-emerald">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add field
        </button>
      </div>
    </div>
  )
}
