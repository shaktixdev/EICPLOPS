'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { fetchDrivers, createTruckApi, type DriverItem } from '@/lib/client-data'

interface TruckModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TruckModal({ isOpen, onClose, onSuccess }: TruckModalProps) {
  const [drivers, setDrivers] = useState<DriverItem[]>([])

  useEffect(() => {
    if (!isOpen) return
    fetchDrivers()
      .then((d) => setDrivers(d.filter((x) => x.status === 'active')))
      .catch(console.error)
  }, [isOpen])

  const [registrationNumber, setRegistrationNumber] = useState('')
  const [ownershipType, setOwnershipType] = useState<'owned' | 'hired'>('owned')
  const [capacityTons, setCapacityTons] = useState(30)
  const [assignedDriverId, setAssignedDriverId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationNumber) return

    const driverObj = drivers.find((d) => d.id === assignedDriverId)

    await createTruckApi({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      ownershipType,
      capacityTons: Number(capacityTons),
      status: 'active',
      assignedDriverId: assignedDriverId || undefined,
      assignedDriverName: driverObj ? driverObj.name : undefined,
    })

    setRegistrationNumber('')
    setAssignedDriverId('')
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Truck"
      subtitle="Register owned fleet vehicle or hired operator truck"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Registration Number *
          </label>
          <input
            type="text"
            required
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="e.g. KA-04-MB-4821"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-500)] uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Ownership Type *
            </label>
            <select
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
            >
              <option value="owned">Owned Fleet</option>
              <option value="hired">Hired Subcontracted</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Capacity (Metric Tons) *
            </label>
            <input
              type="number"
              required
              min={5}
              max={100}
              value={capacityTons}
              onChange={(e) => setCapacityTons(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] numeral focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Default Assigned Driver (Optional)
          </label>
          <select
            value={assignedDriverId}
            onChange={(e) => setAssignedDriverId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
          >
            <option value="">-- Unassigned --</option>
            {drivers.map((drv) => (
              <option key={drv.id} value={drv.id}>
                {drv.name} ({drv.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-bold uppercase tracking-wider shadow-sm"
          >
            Save Truck
          </button>
        </div>
      </form>
    </Modal>
  )
}
