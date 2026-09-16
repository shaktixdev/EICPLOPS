'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { TruckModal } from '@/components/masters/truck-modal'
import { DriverModal } from '@/components/masters/driver-modal'
import { OperatorModal } from '@/components/masters/operator-modal'
import { RequirePermission } from '@/components/auth/require-permission'
import { usePermissions } from '@/hooks/use-permissions'
import {
  fetchTrucks,
  fetchDrivers,
  fetchOperators,
  createTripApi,
  type TruckItem,
  type DriverItem,
  type OperatorItem,
} from '@/lib/client-data'
import {
  FormFieldConfig,
  SECTION_LABELS,
  getEnabledFields,
  loadTripFormFields,
} from '@/lib/form-fields'
import {
  formatCapacity,
  cargoWeightLabel,
  usesLiquidCapacity,
} from '@/lib/types'
import Link from 'next/link'

type FieldValues = Record<string, string | number>

const DEFAULT_VALUES: FieldValues = {
  origin: '',
  destination: '',
  cargoDetails: '',
  freightAmount: '',
  fuelExpenses: '',
  otherExpenses: '',
  hiredTruckPayout: '',
  startMeterReading: '',
  destinationKm: '',
  cargoWeight: '',
  helpers: '',
  dieselQuantity: '',
  ureaQuantity: '',
  expenseGiven: '',
}

function toNumber(value: string | number, fallback = 0) {
  if (value === '' || value === undefined || value === null) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toOptionalNumber(value: string | number) {
  if (value === '' || value === undefined || value === null) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export default function NewTripPage() {
  const router = useRouter()
  const { can } = usePermissions()
  const canWriteMasters = can('masters_write')
  const canEditFields = can('form_fields')

  const [trucks, setTrucks] = useState<TruckItem[]>([])
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [operators, setOperators] = useState<OperatorItem[]>([])

  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [operatorId, setOperatorId] = useState('')

  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [values, setValues] = useState<FieldValues>({ ...DEFAULT_VALUES })

  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false)
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false)
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false)

  useEffect(() => {
    const refresh = () => {
      const loaded = loadTripFormFields()
      setFields(loaded)
      setValues((prev) => {
        const next = { ...prev }
        loaded.forEach((f) => {
          if (next[f.key] === undefined) {
            next[f.key] = f.type === 'number' ? '' : ''
          }
        })
        return next
      })
    }
    refresh()
    window.addEventListener('trip-form-fields-updated', refresh)
    return () => window.removeEventListener('trip-form-fields-updated', refresh)
  }, [])

  const refreshMasters = async () => {
    const [t, d, o] = await Promise.all([fetchTrucks(), fetchDrivers(), fetchOperators()])
    const activeTrucks = t.filter((x) => x.status === 'active')
    const activeDrivers = d.filter((x) => x.status === 'active')
    const activeOperators = o.filter((x) => x.status === 'active')
    setTrucks(activeTrucks)
    setDrivers(activeDrivers)
    setOperators(activeOperators)

    const nextTruckId =
      truckId && activeTrucks.some((x) => x.id === truckId)
        ? truckId
        : activeTrucks[0]?.id || ''
    setTruckId(nextTruckId)

    const linkedDriverId = activeTrucks.find((x) => x.id === nextTruckId)?.assignedDriverId
    setDriverId((prev) => {
      if (prev && activeDrivers.some((x) => x.id === prev)) {
        // Prefer truck's assigned driver when truck just loaded
        if (linkedDriverId && activeDrivers.some((x) => x.id === linkedDriverId)) {
          return linkedDriverId
        }
        return prev
      }
      if (linkedDriverId && activeDrivers.some((x) => x.id === linkedDriverId)) {
        return linkedDriverId
      }
      return activeDrivers[0]?.id || ''
    })
  }

  useEffect(() => {
    refreshMasters().catch(console.error)
  }, [])

  const selectTruck = (id: string) => {
    setTruckId(id)
    const truck = trucks.find((t) => t.id === id)
    if (truck?.assignedDriverId) {
      const linked = drivers.find((d) => d.id === truck.assignedDriverId && d.status === 'active')
      if (linked) setDriverId(linked.id)
    }
  }

  const selectDriver = (id: string) => {
    setDriverId(id)
    const driver = drivers.find((d) => d.id === id)
    if (driver?.assignedTruckId) {
      const linked = trucks.find((t) => t.id === driver.assignedTruckId && t.status === 'active')
      if (linked) setTruckId(linked.id)
    }
  }

  const selectedTruck = trucks.find((t) => t.id === truckId)
  const selectedDriver = drivers.find((d) => d.id === driverId)
  const isHired = selectedTruck?.ownershipType === 'hired'

  const freightAmount = toNumber(values.freightAmount, 0)
  const fuelExpenses = toNumber(values.fuelExpenses, 0)
  const otherExpenses = toNumber(values.otherExpenses, 0)
  const hiredTruckPayout = isHired ? toNumber(values.hiredTruckPayout, 0) : 0
  const calculatedProfit = freightAmount - fuelExpenses - otherExpenses - hiredTruckPayout

  const setValue = (key: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const renderField = (field: FormFieldConfig) => {
    if (field.key === 'hiredTruckPayout' && !isHired) return null

    const value = values[field.key] ?? ''
    const required = Boolean(field.required) || (field.key === 'hiredTruckPayout' && isHired)
    const isLiquidCargo = field.key === 'cargoWeight' && usesLiquidCapacity(selectedTruck?.vehicleType)
    const label = field.key === 'cargoWeight' ? cargoWeightLabel(selectedTruck?.vehicleType) : field.label
    const placeholder = isLiquidCargo ? 'e.g. 20000' : field.placeholder

    return (
      <label key={field.id} className="block space-y-1.5">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {label}
          {required ? ' *' : ''}
        </span>
        {field.type === 'textarea' ? (
          <textarea
            className="input-field min-h-[88px] py-2 h-auto"
            required={required}
            placeholder={placeholder}
            value={String(value)}
            onChange={(e) => setValue(field.key, e.target.value)}
          />
        ) : (
          <input
            type={field.type}
            className={`input-field ${field.type === 'number' ? 'font-mono' : ''}`}
            required={required}
            min={
              field.type === 'number' && field.key === 'freightAmount' && required ? 1000 : undefined
            }
            step={field.type === 'number' ? (field.section === 'finance' ? 100 : 1) : undefined}
            placeholder={placeholder}
            value={value === undefined || value === null ? '' : value}
            onChange={(e) =>
              setValue(
                field.key,
                field.type === 'number'
                  ? e.target.value === ''
                    ? ''
                    : Number(e.target.value)
                  : e.target.value
              )
            }
          />
        )}
      </label>
    )
  }

  const routeFields = useMemo(() => getEnabledFields(fields, 'route'), [fields])
  const physicalFields = useMemo(() => getEnabledFields(fields, 'physical'), [fields])
  const financeFields = useMemo(() => getEnabledFields(fields, 'finance'), [fields])
  const customFields = useMemo(() => getEnabledFields(fields, 'custom'), [fields])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!truckId || !driverId) {
      setError('Select a truck and driver before dispatching.')
      return
    }

    const enabled = fields.filter((f) => f.enabled)
    for (const field of enabled) {
      if (field.key === 'hiredTruckPayout' && !isHired) continue
      const must =
        Boolean(field.required) || (field.key === 'hiredTruckPayout' && isHired)
      if (!must) continue
      const v = values[field.key]
      const empty =
        v === '' ||
        v === undefined ||
        v === null ||
        (typeof v === 'string' && !v.trim())
      if (empty) {
        setError(`${field.label} is required.`)
        return
      }
    }

    const truckObj = trucks.find((t) => t.id === truckId)
    const driverObj = drivers.find((d) => d.id === driverId)
    const operatorObj = operators.find((o) => o.id === operatorId)

    const customPayload: Record<string, string | number> = {}
    fields
      .filter((f) => !f.builtin && f.enabled)
      .forEach((f) => {
        const v = values[f.key]
        if (v !== '' && v !== undefined) customPayload[f.key] = v
      })

    const helpersRaw = String(values.helpers ?? '')

    setSubmitting(true)
    try {
      const createdTrip = await createTripApi({
        truckId,
        truckReg: truckObj ? truckObj.registrationNumber : 'KA-00-XX-0000',
        driverId,
        driverName: driverObj ? driverObj.name : 'Unknown Driver',
        operatorId: operatorId || undefined,
        operatorName: operatorObj ? operatorObj.name : undefined,
        origin: String(values.origin || ''),
        destination: String(values.destination || ''),
        cargoDetails: String(values.cargoDetails || ''),
        freightAmount,
        fuelExpenses,
        otherExpenses,
        hiredTruckPayout,
        status: 'in_transit',
        departureDate: new Date().toISOString(),
        startMeterReading: toOptionalNumber(values.startMeterReading),
        destinationKm: toOptionalNumber(values.destinationKm),
        cargoWeight: toOptionalNumber(values.cargoWeight),
        helpers: helpersRaw
          ? helpersRaw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        dieselQuantity: toOptionalNumber(values.dieselQuantity),
        ureaQuantity: toOptionalNumber(values.ureaQuantity),
        expenseGiven: toOptionalNumber(values.expenseGiven),
        customFields: Object.keys(customPayload).length ? customPayload : undefined,
      })

      router.push(`/trips/${createdTrip.id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch trip. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RequirePermission permission="create_slip">
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Log New Dispatch Trip" subtitle="Configurable gate slip fields from Settings" />

      <div className="px-6 pb-8 max-w-4xl mx-auto w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to trips
          </button>
          {canEditFields && (
            <Link href="/settings" className="btn-ghost h-9 text-xs">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Edit form fields
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="surface-card p-5 space-y-4 animate-fade-up">
            <h3 className="text-xs font-bold uppercase text-[var(--accent-600)] tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              1. Fleet & driver assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Truck *</span>
                  {canWriteMasters && (
                    <button type="button" onClick={() => setIsTruckModalOpen(true)} className="text-[11px] font-bold text-[var(--accent-600)]">
                      + Add truck
                    </button>
                  )}
                </div>
                <select
                  className="input-field"
                  required
                  value={truckId}
                  onChange={(e) => selectTruck(e.target.value)}
                >
                  {trucks.length === 0 ? (
                    <option value="">No trucks — add in Fleet</option>
                  ) : (
                    trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.registrationNumber} ({t.ownershipType.toUpperCase()} —{' '}
                        {formatCapacity(t.capacityTons, t.vehicleType)})
                        {t.assignedDriverName ? ` · ${t.assignedDriverName}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {selectedTruck?.assignedDriverName && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Assigned driver: {selectedTruck.assignedDriverName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Driver *</span>
                  {canWriteMasters && (
                    <button type="button" onClick={() => setIsDriverModalOpen(true)} className="text-[11px] font-bold text-[var(--accent-600)]">
                      + Add driver
                    </button>
                  )}
                </div>
                <select
                  className="input-field"
                  required
                  value={driverId}
                  onChange={(e) => selectDriver(e.target.value)}
                >
                  {drivers.length === 0 ? (
                    <option value="">No drivers — add in Drivers</option>
                  ) : (
                    drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                        {d.assignedTruckReg ? ` · ${d.assignedTruckReg}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {selectedDriver?.assignedTruckReg && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Assigned truck: {selectedDriver.assignedTruckReg}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Operator / transporter</span>
                  <button type="button" onClick={() => setIsOperatorModalOpen(true)} className="text-[11px] font-bold text-[var(--accent-600)]">
                    + Inline add
                  </button>
                </div>
                <select className="input-field" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                  <option value="">— Plant direct transport —</option>
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.contactPhone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {routeFields.length > 0 && (
            <div className="surface-card p-5 space-y-4 animate-fade-up">
              <h3 className="text-xs font-bold uppercase text-[var(--accent-600)] tracking-wider">
                2. {SECTION_LABELS.route}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{routeFields.map(renderField)}</div>
            </div>
          )}

          {physicalFields.length > 0 && (
            <div className="surface-card p-5 space-y-4 animate-fade-up">
              <h3 className="text-xs font-bold uppercase text-[var(--accent-600)] tracking-wider">
                3. {SECTION_LABELS.physical}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{physicalFields.map(renderField)}</div>
            </div>
          )}

          {financeFields.length > 0 && (
            <div className="surface-card p-5 space-y-4 animate-fade-up">
              <h3 className="text-xs font-bold uppercase text-[var(--accent-600)] tracking-wider">
                4. {SECTION_LABELS.finance}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{financeFields.map(renderField)}</div>
              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Estimated trip profit
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Freight − (Fuel + Expenses{isHired ? ' + Hired payout' : ''})
                  </p>
                </div>
                <span
                  className={`text-xl font-bold font-mono ${
                    calculatedProfit >= 0 ? 'text-[var(--accent-600)]' : 'text-rose-500'
                  }`}
                >
                  ₹{calculatedProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="surface-card p-5 space-y-4 animate-fade-up">
              <h3 className="text-xs font-bold uppercase text-[var(--accent-600)] tracking-wider">
                5. {SECTION_LABELS.custom}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{customFields.map(renderField)}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-1">
            {error && (
              <p className="text-xs font-semibold text-rose-500 sm:mr-auto">{error}</p>
            )}
            <button type="button" onClick={() => router.back()} className="btn-ghost" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !truckId || !driverId}>
              {submitting ? 'Dispatching…' : 'Dispatch trip now'}
            </button>
          </div>
        </form>
      </div>

      <TruckModal isOpen={isTruckModalOpen} onClose={() => setIsTruckModalOpen(false)} onSuccess={refreshMasters} />
      <DriverModal isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)} onSuccess={refreshMasters} />
      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onSuccess={refreshMasters}
      />
    </div>
    </RequirePermission>
  )
}
