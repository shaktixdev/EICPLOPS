'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { updateTripApi, type TripItem } from '@/lib/client-data'
import { loadOpsSettings } from '@/lib/ops-settings'

interface ArrivalModalProps {
  trip: TripItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void | Promise<void>
}

function requireMeterReading(): boolean {
  return loadOpsSettings().requireMeter
}

export function ArrivalModal({ trip, isOpen, onClose, onSuccess }: ArrivalModalProps) {
  const [endMeterReading, setEndMeterReading] = useState<string>('')
  const [expenseReturned, setExpenseReturned] = useState<string>('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !trip) return
    setEndMeterReading('')
    setExpenseReturned('')
    setError('')
    setSubmitting(false)
  }, [isOpen, trip?.id])

  if (!trip) return null

  const meterRequired = requireMeterReading()
  const startMeter = trip.startMeterReading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const meterVal = endMeterReading.trim() === '' ? undefined : Number(endMeterReading)
    const expenseVal = expenseReturned.trim() === '' ? undefined : Number(expenseReturned)

    if (meterRequired && (meterVal === undefined || !Number.isFinite(meterVal))) {
      setError('End meter reading (KM) is required.')
      return
    }
    if (meterVal !== undefined && !Number.isFinite(meterVal)) {
      setError('Enter a valid end meter reading.')
      return
    }
    if (
      meterVal !== undefined &&
      startMeter !== undefined &&
      Number.isFinite(startMeter) &&
      meterVal < startMeter
    ) {
      setError(`End meter cannot be less than start reading (${startMeter} KM).`)
      return
    }
    if (expenseVal !== undefined && (!Number.isFinite(expenseVal) || expenseVal < 0)) {
      setError('Enter a valid expense return amount.')
      return
    }

    setSubmitting(true)
    try {
      await updateTripApi(trip.id, {
        status: 'completed',
        arrivalDate: new Date().toISOString(),
        endMeterReading: meterVal,
        expenseReturned: expenseVal,
      })
      await onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to mark arrival.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark arrival"
      subtitle={`${trip.tripNumber} · ${trip.truckReg}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] px-3 py-2.5 text-xs text-[var(--text-secondary)] space-y-1">
          <p>
            Driver: <span className="font-semibold text-[var(--text-primary)]">{trip.driverName}</span>
          </p>
          {startMeter !== undefined && (
            <p>
              Start meter:{' '}
              <span className="font-semibold text-[var(--text-primary)] font-mono">
                {startMeter.toLocaleString('en-IN')} KM
              </span>
            </p>
          )}
          {(trip.expenseGiven ?? 0) > 0 && (
            <p>
              Expense given:{' '}
              <span className="font-semibold text-[var(--text-primary)] font-mono">
                ₹{(trip.expenseGiven || 0).toLocaleString('en-IN')}
              </span>
            </p>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            End meter reading (KM){meterRequired ? ' *' : ''}
          </span>
          <input
            type="number"
            className="input-field font-mono"
            min={0}
            step={1}
            required={meterRequired}
            value={endMeterReading}
            onChange={(e) => setEndMeterReading(e.target.value)}
            placeholder={startMeter !== undefined ? `Start was ${startMeter}` : 'e.g. 150450'}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Expense returned (₹)
          </span>
          <input
            type="number"
            className="input-field font-mono"
            min={0}
            step={1}
            value={expenseReturned}
            onChange={(e) => setExpenseReturned(e.target.value)}
            placeholder={
              (trip.expenseGiven ?? 0) > 0
                ? `Given ₹${trip.expenseGiven!.toLocaleString('en-IN')}`
                : 'e.g. 500'
            }
          />
        </label>

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm arrival'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
