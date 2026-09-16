'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import {
  fetchDrivers,
  createTruckApi,
  updateTruckApi,
  type DriverItem,
  type TruckItem,
} from '@/lib/client-data'
import { VEHICLE_TYPES, type VehicleType, capacityFieldLabel, usesLiquidCapacity, defaultCapacity } from '@/lib/types'

interface TruckModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  truck?: TruckItem | null
}

export function TruckModal({ isOpen, onClose, onSuccess, truck = null }: TruckModalProps) {
  const isEdit = Boolean(truck)
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('truck')
  const [ownershipType, setOwnershipType] = useState<'owned' | 'hired'>('owned')
  const [capacityTons, setCapacityTons] = useState(30)
  const [status, setStatus] = useState<'active' | 'maintenance' | 'archived'>('active')
  const [assignedDriverId, setAssignedDriverId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    fetchDrivers()
      .then((d) => setDrivers(d.filter((x) => x.status === 'active')))
      .catch(console.error)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (truck) {
      setRegistrationNumber(truck.registrationNumber)
      setVehicleType(truck.vehicleType || 'truck')
      setOwnershipType(truck.ownershipType)
      setCapacityTons(truck.capacityTons)
      setStatus(truck.status)
      setAssignedDriverId(truck.assignedDriverId || '')
    } else {
      setRegistrationNumber('')
      setVehicleType('truck')
      setOwnershipType('owned')
      setCapacityTons(30)
      setStatus('active')
      setAssignedDriverId('')
    }
    setError('')
  }, [isOpen, truck])

  const handleVehicleTypeChange = (next: VehicleType) => {
    const prevLiquid = usesLiquidCapacity(vehicleType)
    const nextLiquid = usesLiquidCapacity(next)
    setVehicleType(next)
    if (prevLiquid !== nextLiquid && !truck) {
      setCapacityTons(defaultCapacity(next))
    } else if (prevLiquid !== nextLiquid && truck) {
      // Switching unit on edit — reset to a sensible default for the new unit
      setCapacityTons(defaultCapacity(next))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationNumber.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const driverObj = drivers.find((d) => d.id === assignedDriverId)
      const payload = {
        registrationNumber: registrationNumber.toUpperCase().trim(),
        vehicleType,
        ownershipType,
        capacityTons: Number(capacityTons),
        status,
        assignedDriverId: assignedDriverId || undefined,
        assignedDriverName: driverObj ? driverObj.name : undefined,
      }

      if (isEdit && truck) {
        await updateTruckApi(truck.id, {
          ...payload,
          assignedDriverId: assignedDriverId || '',
        })
      } else {
        await createTruckApi({ ...payload, status: 'active' })
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save truck.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Truck' : 'Add Truck'}
      subtitle={
        isEdit
          ? 'Update vehicle details, type, and assignment'
          : 'Register owned fleet vehicle or hired operator truck'
      }
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
              Vehicle Type *
            </label>
            <select
              value={vehicleType}
              onChange={(e) => handleVehicleTypeChange(e.target.value as VehicleType)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Ownership Type *
            </label>
            <select
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as 'owned' | 'hired')}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
            >
              <option value="owned">Owned Fleet</option>
              <option value="hired">Hired Subcontracted</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              {capacityFieldLabel(vehicleType)} *
            </label>
            <input
              type="number"
              required
              min={usesLiquidCapacity(vehicleType) ? 500 : 5}
              max={usesLiquidCapacity(vehicleType) ? 100000 : 100}
              step={usesLiquidCapacity(vehicleType) ? 100 : 1}
              value={capacityTons}
              onChange={(e) => setCapacityTons(Number(e.target.value))}
              placeholder={usesLiquidCapacity(vehicleType) ? 'e.g. 20000' : 'e.g. 30'}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] numeral focus:outline-none focus:border-[var(--accent-500)]"
            />
            {usesLiquidCapacity(vehicleType) && (
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Tankers carry liquid — enter capacity in litres.
              </p>
            )}
          </div>

          {isEdit && (
            <div>
              <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
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

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-bold uppercase tracking-wider shadow-sm"
          >
            {submitting ? 'Saving…' : isEdit ? 'Update Truck' : 'Save Truck'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
