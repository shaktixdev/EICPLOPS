'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import { TruckModal } from '@/components/masters/truck-modal'
import { fetchTrucks, updateTruckApi, type TruckItem } from '@/lib/client-data'
import { usePermissions } from '@/hooks/use-permissions'
import { Plus, Search, Filter } from 'lucide-react'

export default function TrucksMasterPage() {
  const { can } = usePermissions()
  const canWrite = can('masters_write')
  const canDelete = can('delete_data')
  const [trucks, setTrucks] = useState<TruckItem[]>([])
  const [search, setSearch] = useState('')
  const [filterOwnership, setFilterOwnership] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const refreshList = async () => {
    setTrucks(await fetchTrucks())
  }

  useEffect(() => {
    refreshList().catch(console.error)
  }, [])

  const handleArchive = async (id: string) => {
    await updateTruckApi(id, { status: 'archived' })
    await refreshList()
  }

  const filteredTrucks = trucks.filter((t) => {
    const matchesSearch = t.registrationNumber.toLowerCase().includes(search.toLowerCase())
    const matchesOwnership = filterOwnership === 'all' || t.ownershipType === filterOwnership
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesOwnership && matchesStatus
  })

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Trucks" subtitle="Fleet registration, ownership types, and default driver assignments" />

      <div className="px-6 pb-8 space-y-5">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reg number..."
                className="input-field pl-10 font-mono uppercase"
              />
            </div>

            {/* Ownership Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
              <select
                value={filterOwnership}
                onChange={(e) => setFilterOwnership(e.target.value)}
                className="input-field pl-10 w-auto cursor-pointer"
              >
                <option value="all">All Ownership</option>
                <option value="owned">Owned</option>
                <option value="hired">Hired</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field w-auto cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {canWrite && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Truck</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="surface-card overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-4 px-6 font-medium">Registration No</th>
                  <th className="py-4 px-6 font-medium">Ownership</th>
                  <th className="py-4 px-6 font-medium">Capacity (MT)</th>
                  <th className="py-4 px-6 font-medium">Assigned Driver</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  {canDelete && <th className="py-4 px-6 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 6 : 5} className="py-8 text-center text-[var(--text-muted)] font-medium">
                      No truck masters found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                      <td className="py-4 px-6 font-mono font-bold text-[var(--text-primary)] text-sm">
                        {truck.registrationNumber}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                            truck.ownershipType === 'owned'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {truck.ownershipType}
                        </span>
                      </td>
                      <td className="py-4 px-6 numeral font-medium text-[var(--text-primary)]">
                        {truck.capacityTons} Tons
                      </td>
                      <td className="py-4 px-6 text-[var(--text-secondary)]">
                        {truck.assignedDriverName || (
                          <span className="text-[var(--text-muted)] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={truck.status} />
                      </td>
                      {canDelete && (
                        <td className="py-4 px-6 text-right">
                          {truck.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(truck.id)}
                              className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors inline-flex items-center"
                            >
                              Archive
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TruckModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refreshList} />
    </div>
  )
}
