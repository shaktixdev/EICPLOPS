'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchTrips, fetchTrucks, type TripItem } from '@/lib/client-data'
import {
  FormFieldConfig,
  SECTION_LABELS,
  FormFieldSection,
  loadTripFormFields,
  formatFieldValue,
  fieldLabelWithoutUnit,
} from '@/lib/form-fields'
import { loadOpsSettings, saveOpsSettings } from '@/lib/ops-settings'
import { cargoWeightLabel } from '@/lib/types'

type PrintRow = { key: string; label: string; value: string; section: FormFieldSection | 'meta' }

function isFilled(key: string, value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0 && value.some((v) => String(v).trim())
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return false
    if (value === 0 && key !== 'freightAmount') return false
    return true
  }
  return Boolean(value)
}

function formatValue(key: string, value: unknown, vehicleType?: string | null): string {
  return formatFieldValue(key, value, vehicleType)
}

function readTripField(trip: TripItem, key: string): unknown {
  const direct: Record<string, unknown> = {
    origin: trip.origin,
    destination: trip.destination,
    cargoDetails: trip.cargoDetails,
    freightAmount: trip.freightAmount,
    fuelExpenses: trip.fuelExpenses,
    otherExpenses: trip.otherExpenses,
    hiredTruckPayout: trip.hiredTruckPayout,
    startMeterReading: trip.startMeterReading,
    endMeterReading: trip.endMeterReading,
    destinationKm: trip.destinationKm,
    cargoWeight: trip.cargoWeight,
    helpers: trip.helpers,
    dieselQuantity: trip.dieselQuantity,
    ureaQuantity: trip.ureaQuantity,
    expenseGiven: trip.expenseGiven,
    expenseReturned: trip.expenseReturned,
    arrivalDate: trip.arrivalDate,
  }
  if (key in direct) return direct[key]
  if (trip.customFields && key in trip.customFields) return trip.customFields[key]
  return undefined
}

function buildPrintRows(
  trip: TripItem,
  fields: FormFieldConfig[],
  vehicleType?: string | null
): PrintRow[] {
  const rows: PrintRow[] = []
  const usedKeys = new Set<string>()

  const ordered = [...fields].sort((a, b) => a.order - b.order)
  for (const field of ordered) {
    if (!field.enabled) continue
    const raw = readTripField(trip, field.key)
    if (!isFilled(field.key, raw)) continue
    const label =
      field.key === 'cargoWeight'
        ? fieldLabelWithoutUnit(cargoWeightLabel(vehicleType))
        : fieldLabelWithoutUnit(field.label)
    rows.push({
      key: field.key,
      label,
      value: formatValue(field.key, raw, vehicleType),
      section: field.section,
    })
    usedKeys.add(field.key)
  }

  if (trip.customFields) {
    Object.entries(trip.customFields).forEach(([key, value]) => {
      if (usedKeys.has(key) || !isFilled(key, value)) return
      const cfg = fields.find((f) => f.key === key)
      rows.push({
        key,
        label: fieldLabelWithoutUnit(cfg?.label || key.replace(/^custom_/, '').replace(/_/g, ' ')),
        value: formatValue(key, value, vehicleType),
        section: cfg?.section || 'custom',
      })
      usedKeys.add(key)
    })
  }

  const extras: { key: keyof TripItem; label: string; section: FormFieldSection }[] = [
    { key: 'endMeterReading', label: 'End Meter Reading', section: 'physical' },
    { key: 'expenseReturned', label: 'Expense Returned', section: 'physical' },
    { key: 'arrivalDate', label: 'Arrival Date', section: 'route' },
  ]
  for (const extra of extras) {
    if (usedKeys.has(extra.key)) continue
    const raw = trip[extra.key]
    if (!isFilled(extra.key, raw)) continue
    rows.push({
      key: extra.key,
      label: extra.label,
      value:
        extra.key === 'arrivalDate'
          ? formatDateTime(String(raw))
          : formatValue(extra.key, raw, vehicleType),
      section: extra.section,
    })
  }

  return rows
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateTime(iso: string) {
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

const SIGNATORIES = ['Driver', 'Supervisor', 'Guard'] as const

export default function TripPrintPage() {
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripItem | null>(null)
  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [gateId, setGateId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [vehicleType, setVehicleType] = useState<string | null>(null)

  useEffect(() => {
    setFields(loadTripFormFields())
    const ops = loadOpsSettings()
    saveOpsSettings(ops)
    setCompanyName(ops.companyName)
    setCompanyAddress(ops.companyAddress)
    setGateId(ops.gateId)
    setTerminalId(ops.terminalId)
  }, [])

  useEffect(() => {
    Promise.all([fetchTrips(), fetchTrucks()])
      .then(([trips, trucks]) => {
        const found = trips.find((t) => t.id === tripId) ?? null
        setTrip(found)
        if (found) {
          setVehicleType(trucks.find((t) => t.id === found.truckId)?.vehicleType || null)
        }
      })
      .catch(console.error)
  }, [tripId])

  const rows = useMemo(
    () => (trip ? buildPrintRows(trip, fields, vehicleType) : []),
    [trip, fields, vehicleType]
  )

  const sections = useMemo(() => {
    const order: FormFieldSection[] = ['route', 'physical', 'finance', 'custom']
    return order
      .map((section) => ({
        section,
        label: SECTION_LABELS[section],
        rows: rows.filter((r) => r.section === section),
      }))
      .filter((g) => g.rows.length > 0)
  }, [rows])

  useEffect(() => {
    if (!trip) return
    const timer = setTimeout(() => window.print(), 600)
    return () => clearTimeout(timer)
  }, [trip])

  if (!trip) {
    return (
      <div className="slip-shell">
        <div className="slip-page slip-loading">Preparing dispatch slip…</div>
      </div>
    )
  }

  const dispatchDate = formatDate(trip.departureDate)
  const dispatchTime = formatTime(trip.departureDate)

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .slip-shell {
            background: #fff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .slip-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
          }
        }

        .slip-shell {
          min-height: 100vh;
          background: #eef1ef;
          padding: 32px 16px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #1a1f1c;
        }

        .slip-page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          box-shadow: 0 18px 50px rgba(26, 31, 28, 0.1);
          padding: 20mm 18mm 18mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .slip-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .slip-loading {
          display: grid;
          place-items: center;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a9690;
        }

        .slip-top {
          text-align: center;
          padding-bottom: 18px;
          border-bottom: 2px solid #0d6b54;
        }

        .slip-top h1 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #0a2f26;
          line-height: 1.2;
        }

        .slip-top .company-address {
          margin: 0 auto 10px;
          font-size: 11px;
          font-weight: 500;
          color: #5c6b64;
          line-height: 1.5;
          max-width: 520px;
          white-space: pre-line;
        }

        .slip-top .subtitle {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0d6b54;
        }

        .slip-top .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          font-size: 11px;
          color: #5c6b64;
          font-weight: 500;
          text-align: left;
        }

        .slip-top .slip-no {
          font-size: 14px;
          font-weight: 700;
          color: #1a1f1c;
          letter-spacing: -0.01em;
        }

        .slip-headline {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 28px;
          padding: 22px 0;
          border-bottom: 1px solid #e8eeea;
        }

        .slip-headline .k {
          display: block;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a9690;
          margin-bottom: 8px;
        }

        .slip-headline .v {
          display: block;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #1a1f1c;
          line-height: 1.2;
        }

        .slip-headline .v.sub {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #0d6b54;
        }

        .slip-party {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 40px;
          padding: 20px 0;
          border-bottom: 1px solid #e8eeea;
        }

        .slip-party .k {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a9690;
          margin-bottom: 6px;
        }

        .slip-party .v {
          font-size: 15px;
          font-weight: 600;
          color: #1a1f1c;
        }

        .slip-party .full {
          grid-column: 1 / -1;
        }

        .slip-body {
          padding: 8px 0 8px;
          flex: 1;
        }

        .slip-section {
          padding: 16px 0 4px;
        }

        .slip-section + .slip-section {
          border-top: 1px solid #eef2f0;
        }

        .slip-section h2 {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0d6b54;
        }

        .slip-row {
          display: grid;
          grid-template-columns: minmax(140px, 34%) 1fr;
          gap: 20px;
          align-items: baseline;
          padding: 7px 0;
        }

        .slip-row .label {
          font-size: 12px;
          font-weight: 500;
          color: #6d7d75;
        }

        .slip-row .value {
          font-size: 13px;
          font-weight: 600;
          color: #1a1f1c;
          text-align: right;
        }

        .slip-empty {
          margin: 20px 0;
          font-size: 12px;
          color: #8a9690;
        }

        .slip-sigs {
          margin-top: auto;
          padding-top: 36px;
        }

        .slip-sigs h2 {
          margin: 0 0 28px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0d6b54;
        }

        .slip-sig-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .slip-sig .role {
          margin: 0 0 40px;
          font-size: 13px;
          font-weight: 600;
          color: #1a1f1c;
        }

        .slip-sig .line {
          border-bottom: 1.5px solid #1a1f1c;
          opacity: 0.35;
        }

        .print-actions {
          display: flex;
          gap: 10px;
        }

        .print-btn {
          appearance: none;
          border: none;
          background: #0d6b54;
          color: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 11px 18px;
          cursor: pointer;
          border-radius: 999px;
        }

        .print-btn.secondary {
          background: #fff;
          color: #0d6b54;
          border: 1px solid #d5ddd8;
        }
      `}</style>

      <div className="slip-shell">
        <div className="print-actions no-print">
          <button type="button" className="print-btn" onClick={() => window.print()}>
            Print A4 slip
          </button>
          <button type="button" className="print-btn secondary" onClick={() => window.close()}>
            Close
          </button>
        </div>

        <article className="slip-page">
          <div className="slip-inner">
            <header className="slip-top">
              <h1>{companyName || 'Company name'}</h1>
              {companyAddress && (
                <p className="company-address">
                  {companyAddress.split('\n').map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              )}
              <p className="subtitle">Gate dispatch slip</p>
              <div className="meta-row">
                <div className="slip-no">{trip.tripNumber}</div>
                {(gateId || terminalId) && (
                  <div>{[gateId, terminalId].filter(Boolean).join(' · ')}</div>
                )}
              </div>
            </header>

            <div className="slip-headline">
              <div>
                <span className="k">Dispatch date</span>
                <span className="v">{dispatchDate}</span>
                <span className="v sub">{dispatchTime}</span>
              </div>
              <div>
                <span className="k">Truck</span>
                <span className="v">{trip.truckReg}</span>
              </div>
              <div>
                <span className="k">Driver</span>
                <span className="v">{trip.driverName}</span>
              </div>
            </div>

            {trip.operatorName && (
              <div className="slip-party">
                <div className="full">
                  <div className="k">Operator</div>
                  <div className="v">{trip.operatorName}</div>
                </div>
              </div>
            )}

            <div className="slip-body">
              {sections.length === 0 ? (
                <p className="slip-empty">No filled form fields for this dispatch.</p>
              ) : (
                sections.map((group) => (
                  <section key={group.section} className="slip-section">
                    <h2>{group.label}</h2>
                    {group.rows.map((row) => (
                      <div key={row.key} className="slip-row">
                        <span className="label">{row.label}</span>
                        <span className="value">{row.value}</span>
                      </div>
                    ))}
                  </section>
                ))
              )}
            </div>

            <section className="slip-sigs">
              <h2>Signatures</h2>
              <div className="slip-sig-grid">
                {SIGNATORIES.map((role) => (
                  <div key={role} className="slip-sig">
                    <p className="role">{role}</p>
                    <div className="line" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </>
  )
}
