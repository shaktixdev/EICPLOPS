'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import {
  fetchTrucks,
  createDriverApi,
  updateDriverApi,
  type TruckItem,
  type DriverItem,
} from '@/lib/client-data'

interface DriverModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  driver?: DriverItem | null
}

export function DriverModal({ isOpen, onClose, onSuccess, driver = null }: DriverModalProps) {
  const isEdit = Boolean(driver)
  const [trucks, setTrucks] = useState<TruckItem[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [assignedTruckId, setAssignedTruckId] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>('active')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    fetchTrucks()
      .then((t) => setTrucks(t.filter((x) => x.status === 'active')))
      .catch(console.error)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (driver) {
      setName(driver.name)
      setPhone(driver.phone)
      setLicenseNumber(driver.licenseNumber || '')
      setLicenseExpiry(driver.licenseExpiry || '')
      setAssignedTruckId(driver.assignedTruckId || '')
      setStatus(driver.status)
    } else {
      setName('')
      setPhone('')
      setLicenseNumber('')
      setLicenseExpiry('')
      setAssignedTruckId('')
      setStatus('active')
    }
    setError('')
  }, [isOpen, driver])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Driver name is required.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const truckObj = trucks.find((t) => t.id === assignedTruckId)
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim() ? licenseNumber.trim().toUpperCase() : undefined,
        licenseExpiry: licenseExpiry || undefined,
        assignedTruckId: assignedTruckId || undefined,
        assignedTruckReg: truckObj ? truckObj.registrationNumber : undefined,
        status,
      }

      if (isEdit && driver) {
        await updateDriverApi(driver.id, {
          ...payload,
          assignedTruckId: assignedTruckId || '',
          licenseNumber: licenseNumber.trim() ? licenseNumber.trim().toUpperCase() : '',
          licenseExpiry: licenseExpiry || '',
        })
      } else {
        await createDriverApi({ ...payload, status: 'active' })
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save driver.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Driver' : 'Add Driver'}
      subtitle={
        isEdit
          ? 'Update driver profile, license, and truck assignment'
          : 'Register driver profile and optional license / truck assignment'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Driver Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Suresh Patil"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98450 11223"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] numeral focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              License Expiry Date
            </label>
            <input
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Driving License Number
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Optional — e.g. KA0420210089"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-500)] uppercase"
          />
        </div>

        <div className={isEdit ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Assigned Truck (Optional)
            </label>
            <select
              value={assignedTruckId}
              onChange={(e) => setAssignedTruckId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-500)]"
            >
              <option value="">-- Unassigned --</option>
              {trucks.map((trk) => (
                <option key={trk.id} value={trk.id}>
                  {trk.registrationNumber} ({trk.ownershipType})
                </option>
              ))}
            </select>
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
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold hover:text-[var(--text-primary)]"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-bold uppercase tracking-wider shadow-sm"
          >
            {submitting ? 'Saving…' : isEdit ? 'Update Driver' : 'Save Driver'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
