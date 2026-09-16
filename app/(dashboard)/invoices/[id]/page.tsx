'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  fetchInvoices,
  fetchTrips,
  updateInvoiceStatusApi,
  type InvoiceItem,
  type TripItem,
} from '@/lib/client-data'
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react'
import { loadOpsSettings } from '@/lib/ops-settings'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invId = params.id as string

  const [inv, setInv] = useState<InvoiceItem | null>(null)
  const [includedTrips, setIncludedTrips] = useState<TripItem[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')

  useEffect(() => {
    const ops = loadOpsSettings()
    setCompanyName(ops.companyName)
    setCompanyAddress(ops.companyAddress)
  }, [])

  const reload = useCallback(async () => {
    const [invoices, allTrips] = await Promise.all([fetchInvoices(), fetchTrips()])
    const found = invoices.find((i) => i.id === invId) ?? null
    setInv(found)
    if (found) {
      setIncludedTrips(
        allTrips.filter(
          (t) => found.tripNumbers.includes(t.tripNumber) || found.tripIds.includes(t.id)
        )
      )
    } else {
      setIncludedTrips([])
    }
    setLoading(false)
  }, [invId])

  useEffect(() => {
    reload().catch(console.error)
  }, [reload])

  const handleMarkPaid = async () => {
    if (!inv) return
    await updateInvoiceStatusApi(inv.id, 'paid')
    await reload()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Invoice" subtitle="Loading…" />
        <div className="p-6 text-sm text-[var(--text-muted)]">Loading invoice…</div>
      </div>
    )
  }

  if (!inv) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Invoice not found" subtitle="" />
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title={`Invoice — ${inv.invoiceNumber}`} subtitle="Billed freight details and tax invoice summary" />

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>

          <div className="flex items-center gap-2">
            {inv.status !== 'paid' && (
              <button
                onClick={handleMarkPaid}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Paid</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent-500)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[var(--accent-500)]" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-[var(--bg-surface)] p-8 rounded-xl border border-[var(--border-color)] space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
                {companyName || 'Company'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Tax Invoice & Transport Billing
              </p>
              {companyAddress && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1 whitespace-pre-line">
                  {companyAddress}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="font-mono text-base font-bold text-[var(--text-primary)] block">
                {inv.invoiceNumber}
              </span>
              <div className="mt-1">
                <StatusBadge status={inv.status} />
              </div>
            </div>
          </div>

          {/* Customer & Dates Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
            <div>
              <span className="text-[var(--text-muted)] uppercase text-[10px] font-bold block">
                Billed To Customer:
              </span>
              <span className="font-bold text-sm text-[var(--text-primary)] block mt-0.5">
                {inv.customerName}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[var(--text-muted)] uppercase text-[10px] font-bold block">
                Invoice Date & Due Date:
              </span>
              <span className="font-mono text-[var(--text-primary)] block mt-0.5">
                Issued: {inv.createdAt} | Due: <span className="font-bold text-amber-500">{inv.dueDate}</span>
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">
              Itemized Freight Manifest Lines
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  <th className="py-2">Trip Ref</th>
                  <th className="py-2">Truck & Route</th>
                  <th className="py-2">Cargo</th>
                  <th className="py-2 text-right">Freight Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {includedTrips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[var(--text-muted)]">
                      Standard billed freight service line.
                    </td>
                  </tr>
                ) : (
                  includedTrips.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 font-mono font-bold text-[var(--text-primary)]">{t.tripNumber}</td>
                      <td className="py-3 font-medium text-[var(--text-primary)]">
                        {t.truckReg} ({t.destination})
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">{t.cargoDetails}</td>
                      <td className="py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                        ₹{t.freightAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Footer */}
          <div className="flex items-center justify-between border-t-2 border-[var(--border-color)] pt-4">
            <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Total Amount Billed</span>
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              ₹{inv.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
