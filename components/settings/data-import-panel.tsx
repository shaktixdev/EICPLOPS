'use client'

import React, { useRef, useState } from 'react'

type ImportKind = 'trucks' | 'drivers' | 'trips'

type ImportResult = {
  kind: ImportKind
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

const KINDS: Array<{ id: ImportKind; label: string; hint: string }> = [
  { id: 'drivers', label: 'Drivers', hint: 'name, phone, license…' },
  { id: 'trucks', label: 'Trucks', hint: 'registration, ownership, capacity…' },
  { id: 'trips', label: 'Trips', hint: 'truck, driver, route, freight…' },
]

export function DataImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<ImportKind>('drivers')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!file) {
      setError('Choose a CSV or Excel file first')
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('type', kind)
      form.append('file', file)
      const res = await fetch('/api/import', { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Import failed')
      setResult(body)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: any) {
      setError(err?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[var(--accent-600)]">upload_file</span>
          Data import
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Import drivers, trucks, or trips from an Excel (.xlsx) or CSV file. Download a template, fill
          rows, then upload. Existing drivers (by phone) and trucks (by registration) are updated.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              setKind(k.id)
              setResult(null)
              setError('')
            }}
            className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
              kind === k.id
                ? 'bg-[var(--accent-600)] text-white border-[var(--accent-600)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-500)]'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {KINDS.find((k) => k.id === kind)?.hint} · Import trucks after drivers if you assign by phone.
      </p>

      <div className="flex flex-wrap gap-2">
        <a href={`/api/import/template?type=${kind}&format=xlsx`} className="btn-ghost h-9 text-xs" download>
          <span className="material-symbols-outlined text-[16px]">download</span>
          Excel template
        </a>
        <a href={`/api/import/template?type=${kind}&format=csv`} className="btn-ghost h-9 text-xs" download>
          <span className="material-symbols-outlined text-[16px]">download</span>
          CSV template
        </a>
      </div>

      <form onSubmit={handleImport} className="space-y-4 max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Upload file</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--mint-soft)] file:text-[var(--accent-600)] hover:file:bg-[color-mix(in_srgb,var(--mint)_45%,white)]"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setResult(null)
              setError('')
            }}
          />
          {file && (
            <span className="text-xs text-[var(--text-muted)]">
              Selected: <span className="font-mono">{file.name}</span>
            </span>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading || !file}>
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            {loading ? 'Importing…' : `Import ${kind}`}
          </button>
          {error && <span className="text-sm font-semibold text-rose-500">{error}</span>}
        </div>
      </form>

      {result && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 space-y-2 text-sm">
          <p className="font-semibold text-[var(--text-primary)] capitalize">{result.kind} import complete</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="font-semibold text-[var(--accent-600)]">{result.created} created</span>
            <span className="font-semibold text-[var(--text-secondary)]">{result.updated} updated</span>
            <span className="font-semibold text-amber-700">{result.skipped} skipped</span>
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
              {result.errors.slice(0, 20).map((err, i) => (
                <p key={`${err.row}-${i}`} className="text-xs text-rose-600">
                  Row {err.row}: {err.message}
                </p>
              ))}
              {result.errors.length > 20 && (
                <p className="text-xs text-[var(--text-muted)]">…and {result.errors.length - 20} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
