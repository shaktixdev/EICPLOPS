'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import { OperatorModal } from '@/components/masters/operator-modal'
import { fetchOperators, createLedgerApi, type OperatorItem } from '@/lib/client-data'
import { Plus, Search, Building2, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function OperatorsMasterPage() {
  const [operators, setOperators] = useState<OperatorItem[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedOpForLedger, setSelectedOpForLedger] = useState<OperatorItem | null>(null)
  const [ledgerAmount, setLedgerAmount] = useState(5000)
  const [ledgerType, setLedgerType] = useState<'charge' | 'payment'>('payment')
  const [ledgerRef, setLedgerRef] = useState('NEFT / Cash Payment')

  const refreshList = async () => {
    setOperators(await fetchOperators())
  }

  useEffect(() => {
    refreshList().catch(console.error)
  }, [])

  const handleRecordLedger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOpForLedger || ledgerAmount <= 0) return

    await createLedgerApi({
      operatorId: selectedOpForLedger.id,
      operatorName: selectedOpForLedger.name,
      amount: Number(ledgerAmount),
      type: ledgerType,
      reference: ledgerRef,
    })

    setSelectedOpForLedger(null)
    setLedgerAmount(5000)
    await refreshList()
  }

  const filteredOperators = operators.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.gstNumber && o.gstNumber.toLowerCase().includes(search.toLowerCase())) ||
    o.contactPhone.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Transporter / Operator Masters" subtitle="Subcontracted owner-operators, GST records, and running balances" />

      <div className="px-6 pb-8 space-y-5">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operator name, GST, contact..."
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subcontractor</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="surface-card overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-4 px-6 font-medium">Operator Name</th>
                  <th className="py-4 px-6 font-medium">Contact Phone</th>
                  <th className="py-4 px-6 font-medium">GST Number</th>
                  <th className="py-4 px-6 font-medium">Derived Balance</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredOperators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No operator masters found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOperators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                      <td className="py-4 px-6 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>{operator.name}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-[var(--text-muted)]">
                        {operator.contactPhone}
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-[var(--text-primary)]">
                        {operator.gstNumber || <span className="text-[var(--text-muted)] italic">Unregistered</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-mono font-medium ${
                            operator.runningBalance > 0
                              ? 'text-rose-600' // plant owes operator
                              : operator.runningBalance < 0
                              ? 'text-[var(--accent-600)]' // operator owes plant
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          ₹{Math.abs(operator.runningBalance).toLocaleString('en-IN')}{' '}
                          <span className="text-xs text-[var(--text-muted)]">
                            {operator.runningBalance > 0 ? '(Payable)' : operator.runningBalance < 0 ? '(Receivable)' : ''}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={operator.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOpForLedger(operator)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--mint-soft)] hover:bg-[color-mix(in_srgb,var(--mint)_45%,white)] text-[var(--accent-600)] text-xs font-semibold transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OperatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refreshList} />

      {/* Ledger Modal */}
      {selectedOpForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Record Ledger Entry — {selectedOpForLedger.name}
            </h3>

            <form onSubmit={handleRecordLedger} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Entry Type *
                  </label>
                  <div className="relative">
                    <select
                      value={ledgerType}
                      onChange={(e) => setLedgerType(e.target.value as any)}
                      className="w-full px-4 py-2 appearance-none rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(13,107,84,0.15)]"
                    >
                      <option value="payment">Payment Made (Payout)</option>
                      <option value="charge">Freight Charge Owed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={ledgerAmount}
                    onChange={(e) => setLedgerAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(13,107,84,0.15)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Reference / Payment Voucher *
                </label>
                <input
                  type="text"
                  required
                  value={ledgerRef}
                  onChange={(e) => setLedgerRef(e.target.value)}
                  placeholder="e.g. UTR / Cheque No / NEFT ref"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(13,107,84,0.15)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedOpForLedger(null)}
                  className="px-5 py-2.5 rounded-full text-[var(--text-secondary)] font-semibold hover:bg-[var(--bg-subtle)] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
