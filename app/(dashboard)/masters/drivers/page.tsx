'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { DriverModal } from '@/components/masters/driver-modal'
import { fetchDrivers, createAdvanceApi, type DriverItem } from '@/lib/client-data'
import { usePermissions } from '@/hooks/use-permissions'
import { Plus, Search, AlertTriangle, Wallet } from 'lucide-react'

export default function DriversMasterPage() {
  const { can } = usePermissions()
  const canWrite = can('masters_write')
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDriverForAdv, setSelectedDriverForAdv] = useState<DriverItem | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState(1000)
  const [advancePurpose, setAdvancePurpose] = useState('Fuel & Cash Advance')

  const refreshList = async () => {
    setDrivers(await fetchDrivers())
  }

  useEffect(() => {
    refreshList().catch(console.error)
  }, [])

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDriverForAdv || advanceAmount <= 0) return

    await createAdvanceApi({
      driverId: selectedDriverForAdv.id,
      driverName: selectedDriverForAdv.name,
      amount: Number(advanceAmount),
      purpose: advancePurpose,
    })

    setSelectedDriverForAdv(null)
    setAdvanceAmount(1000)
    await refreshList()
  }

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.licenseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
  )

  // License expiry check (warning if expiring within 60 days)
  const isLicenseExpiringSoon = (expiryDateStr?: string) => {
    if (!expiryDateStr) return false
    const expiry = new Date(expiryDateStr).getTime()
    if (Number.isNaN(expiry)) return false
    const now = new Date().getTime()
    const daysLeft = (expiry - now) / (1000 * 3600 * 24)
    return daysLeft < 60
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Drivers" subtitle="Driver profiles, license validity tracking, and cash advance ledgers" />

      <div className="px-6 pb-8 space-y-5">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by driver name, license, phone..."
              className="input-field pl-10"
            />
          </div>

          {canWrite && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="surface-card overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-4 px-6 font-medium">Driver Name</th>
                  <th className="py-4 px-6 font-medium">Phone Number</th>
                  <th className="py-4 px-6 font-medium">License Number</th>
                  <th className="py-4 px-6 font-medium">License Expiry</th>
                  <th className="py-4 px-6 font-medium">Assigned Truck</th>
                  <th className="py-4 px-6 font-medium">Outstanding Advance</th>
                  {canWrite && <th className="py-4 px-6 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={canWrite ? 7 : 6} className="py-8 text-center text-[var(--text-muted)]">
                      No driver masters found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const expiryWarning = isLicenseExpiringSoon(driver.licenseExpiry)

                    return (
                      <tr key={driver.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                        <td className="py-4 px-6 font-semibold text-[var(--text-primary)]">
                          {driver.name}
                        </td>
                        <td className="py-4 px-6 font-mono text-[var(--text-muted)]">
                          {driver.phone}
                        </td>
                        <td className="py-4 px-6 font-mono font-medium text-[var(--text-primary)]">
                          {driver.licenseNumber || (
                            <span className="text-[var(--text-muted)] italic">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--text-secondary)]">
                              {driver.licenseExpiry || '—'}
                            </span>
                            {expiryWarning && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                <AlertTriangle className="w-3 h-3" />
                                Expiring Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono font-medium text-[var(--text-secondary)]">
                          {driver.assignedTruckReg || <span className="text-[var(--text-muted)] italic">None</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`font-mono font-medium ${
                              driver.advanceBalance > 0 ? 'text-amber-600' : 'text-[var(--accent-600)]'
                            }`}
                          >
                            ₹{driver.advanceBalance.toLocaleString('en-IN')}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => setSelectedDriverForAdv(driver)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--mint-soft)] hover:bg-[color-mix(in_srgb,var(--mint)_45%,white)] text-[var(--accent-600)] text-xs font-semibold transition-colors"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Issue Advance</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DriverModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refreshList} />

      {/* Advance Modal */}
      {selectedDriverForAdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Record Advance to {selectedDriverForAdv.name}
            </h3>

            <form onSubmit={handleIssueAdvance} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Advance Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={100}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(13,107,84,0.15)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Purpose / Reference *
                </label>
                <input
                  type="text"
                  required
                  value={advancePurpose}
                  onChange={(e) => setAdvancePurpose(e.target.value)}
                  placeholder="e.g. Diesel allowance, Trip Cash"
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(13,107,84,0.15)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedDriverForAdv(null)}
                  className="px-5 py-2.5 rounded-full text-[var(--text-secondary)] font-semibold hover:bg-[var(--bg-subtle)] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
