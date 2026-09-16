'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { createOperatorApi } from '@/lib/client-data'

interface OperatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function OperatorModal({ isOpen, onClose, onSuccess }: OperatorModalProps) {
  const [name, setName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [gstNumber, setGstNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !contactPhone) return

    await createOperatorApi({
      name: name.trim(),
      contactPhone: contactPhone.trim(),
      gstNumber: gstNumber.trim().toUpperCase() || undefined,
      status: 'active',
    })

    setName('')
    setContactPhone('')
    setGstNumber('')
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Subcontractor Operator"
      subtitle="Register third-party transport company for subcontracted trips"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Transporter / Company Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Deccan Freight Logistics"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-500)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Contact Phone *
            </label>
            <input
              type="text"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 80 2345 6789"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] numeral focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[var(--text-secondary)] mb-1">
              GST Tax Number (Optional)
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="29ABCDE1234F1Z5"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] font-mono uppercase focus:outline-none focus:border-[var(--accent-500)]"
            />
          </div>
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
            Save Transporter Master
          </button>
        </div>
      </form>
    </Modal>
  )
}
