'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import { RequirePermission } from '@/components/auth/require-permission'
import {
  fetchInvoices,
  fetchTrips,
  createInvoiceApi,
  updateInvoiceStatusApi,
  type InvoiceItem,
  type TripItem,
} from '@/lib/client-data'
import { Plus, Search, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <RequirePermission permission="invoices">
      <InvoicesPageInner />
    </RequirePermission>
  )
}

function InvoicesPageInner() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [billableTrips, setBillableTrips] = useState<TripItem[]>([])
  const [search, setSearch] = useState('')
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  // Generate Invoice Form State
  const [customerName, setCustomerName] = useState('')
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('2026-09-30')

  const refreshList = async () => {
    const [inv, trips] = await Promise.all([fetchInvoices(), fetchTrips()])
    setInvoices(inv)
    setBillableTrips(trips.filter((t) => t.status === 'completed' || t.status === 'in_transit'))
  }

  useEffect(() => {
    refreshList().catch(console.error)
  }, [])

  const handleMarkPaid = async (id: string) => {
    await updateInvoiceStatusApi(id, 'paid')
    await refreshList()
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTripIds.length === 0 || !customerName) return

    await createInvoiceApi(customerName, selectedTripIds, dueDate)
    setSelectedTripIds([])
    setIsGenerateModalOpen(false)
    await refreshList()
  }

  const toggleTripSelection = (tripId: string) => {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId))
    } else {
      setSelectedTripIds([...selectedTripIds, tripId])
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Invoicing & Billing" subtitle="Automated invoice generation from completed trips and status tracking" />

      <div className="px-6 pb-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 surface-card p-4 animate-fade-up">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice no, customer name..."
              className="input-field pl-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a href="/api/export?type=invoices" download className="btn-ghost">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>

            <button onClick={() => setIsGenerateModalOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>

        <div className="surface-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.06s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Trips Included</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-xs font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                      No invoices found matching search.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-[var(--accent-500)] underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                        {inv.tripNumbers.join(', ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--text-primary)]">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-[var(--accent-600)] text-[11px] font-bold border border-emerald-500/30 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase text-[var(--text-primary)]">
              Generate Invoice From Completed Trips
            </h3>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
                  Customer / Billed Entity *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ultra Infra Builders Pvt Ltd"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-2">
                  Select Completed Trips to Include ({selectedTripIds.length} selected) *
                </label>

                <div className="max-h-48 overflow-y-auto space-y-2 border border-[var(--border-color)] p-2 rounded-lg bg-[var(--bg-subtle)]">
                  {billableTrips.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] p-2">No unbilled completed trips available.</p>
                  ) : (
                    billableTrips.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                          selectedTripIds.includes(t.id)
                            ? 'bg-[var(--accent-500)]/15 border-[var(--accent-500)]'
                            : 'border-[var(--border-color)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTripIds.includes(t.id)}
                            onChange={() => toggleTripSelection(t.id)}
                            className="rounded border-[var(--border-color)] text-[var(--accent-500)]"
                          />
                          <div>
                            <span className="font-mono font-bold text-[var(--text-primary)]">{t.tripNumber}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] block">{t.destination}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          ₹{t.freightAmount.toLocaleString('en-IN')}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedTripIds.length === 0}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:opacity-50 text-white font-bold uppercase tracking-wider"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
