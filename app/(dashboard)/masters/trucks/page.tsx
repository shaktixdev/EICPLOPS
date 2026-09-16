'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import { TruckModal } from '@/components/masters/truck-modal'
import { fetchTrucks, updateTruckApi, deleteTruckApi, type TruckItem } from '@/lib/client-data'
import { VEHICLE_TYPES, vehicleTypeLabel, formatCapacity } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react'

export default function TrucksMasterPage() {
  const { can } = usePermissions()
  const canWrite = can('masters_write')
  const canDelete = can('delete_data')
  const [trucks, setTrucks] = useState<TruckItem[]>([])
  const [search, setSearch] = useState('')
  const [filterOwnership, setFilterOwnership] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTruck, setEditingTruck] = useState<TruckItem | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refreshList = async () => {
    setTrucks(await fetchTrucks())
  }

  useEffect(() => {
    refreshList().catch(console.error)
  }, [])

  const openCreate = () => {
    setEditingTruck(null)
    setIsModalOpen(true)
  }

  const openEdit = (truck: TruckItem) => {
    setEditingTruck(truck)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTruck(null)
  }

  const handleArchive = async (id: string) => {
    setBusyId(id)
    try {
      await updateTruckApi(id, { status: 'archived' })
      await refreshList()
    } catch (err: any) {
      alert(err?.message || 'Failed to archive truck')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (truck: TruckItem) => {
    if (!confirm(`Delete ${truck.registrationNumber}? This cannot be undone.`)) return
    setBusyId(truck.id)
    try {
      await deleteTruckApi(truck.id)
      await refreshList()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete truck')
    } finally {
      setBusyId(null)
    }
  }

  const filteredTrucks = trucks.filter((t) => {
    const matchesSearch = t.registrationNumber.toLowerCase().includes(search.toLowerCase())
    const matchesOwnership = filterOwnership === 'all' || t.ownershipType === filterOwnership
    const matchesType = filterType === 'all' || t.vehicleType === filterType
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesOwnership && matchesType && matchesStatus
  })

  const showActions = canWrite || canDelete
  const colSpan = showActions ? 7 : 6

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Trucks" subtitle="Fleet registration, ownership types, and default driver assignments" />

      <div className="px-6 pb-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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

            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field pl-10 w-auto cursor-pointer"
              >
                <option value="all">All Types</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filterOwnership}
                onChange={(e) => setFilterOwnership(e.target.value)}
                className="input-field w-auto cursor-pointer"
              >
                <option value="all">All Ownership</option>
                <option value="owned">Owned</option>
                <option value="hired">Hired</option>
              </select>
            </div>

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
            <button onClick={openCreate} className="btn-primary w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>Add Truck</span>
            </button>
          )}
        </div>

        <div className="surface-card overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-4 px-6 font-medium">Registration No</th>
                  <th className="py-4 px-6 font-medium">Type</th>
                  <th className="py-4 px-6 font-medium">Ownership</th>
                  <th className="py-4 px-6 font-medium">Capacity</th>
                  <th className="py-4 px-6 font-medium">Assigned Driver</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  {showActions && <th className="py-4 px-6 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="py-8 text-center text-[var(--text-muted)] font-medium">
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
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-sky-50 text-sky-700">
                          {vehicleTypeLabel(truck.vehicleType)}
                        </span>
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
                        {formatCapacity(truck.capacityTons, truck.vehicleType)}
                      </td>
                      <td className="py-4 px-6 text-[var(--text-secondary)]">
                        {truck.assignedDriverName || (
                          <span className="text-[var(--text-muted)] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={truck.status} />
                      </td>
                      {showActions && (
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {canWrite && (
                              <button
                                onClick={() => openEdit(truck)}
                                disabled={busyId === truck.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            {canDelete && truck.status !== 'archived' && (
                              <button
                                onClick={() => handleArchive(truck.id)}
                                disabled={busyId === truck.id}
                                className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors"
                              >
                                Archive
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(truck)}
                                disabled={busyId === truck.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
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

      <TruckModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={refreshList}
        truck={editingTruck}
      />
    </div>
  )
}
