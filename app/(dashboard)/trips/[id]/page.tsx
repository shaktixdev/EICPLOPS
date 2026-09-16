'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  fetchTrips,
  fetchAdvances,
  fetchTrucks,
  type TripItem,
  type AdvanceItem,
} from '@/lib/client-data'
import { loadTripFormFields } from '@/lib/form-fields'
import { formatCargoWeight } from '@/lib/types'
import { ArrivalModal } from '@/components/trips/arrival-modal'
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
} from 'lucide-react'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripItem | null>(null)
  const [advances, setAdvances] = useState<AdvanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [truckVehicleType, setTruckVehicleType] = useState<string | null>(null)

  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false)

  const reload = useCallback(async () => {
    const [trips, allAdvances, trucks] = await Promise.all([
      fetchTrips(),
      fetchAdvances(),
      fetchTrucks(),
    ])
    const found = trips.find((t) => t.id === tripId) ?? null
    setTrip(found)
    if (found) {
      setAdvances(allAdvances.filter((a) => a.tripId === found.id || a.driverId === found.driverId))
      setTruckVehicleType(trucks.find((t) => t.id === found.truckId)?.vehicleType || null)
    } else {
      setAdvances([])
      setTruckVehicleType(null)
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    reload().catch(console.error)
  }, [reload])

  const pipeline = [
    { key: 'draft', label: 'Draft Created' },
    { key: 'in_transit', label: 'Dispatched (In Transit)' },
    { key: 'completed', label: 'Arrived at Site' },
    { key: 'invoiced', label: 'Invoice Billed' },
    { key: 'paid', label: 'Payment Settled' },
  ]

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Trip Detail" subtitle="Loading…" />
        <div className="p-6 text-sm text-[var(--text-muted)]">Loading trip…</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Trip not found" subtitle="" />
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trips List
          </button>
        </div>
      </div>
    )
  }

  const currentStepIdx = pipeline.findIndex((p) => p.key === trip.status)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title={`Trip Detail — ${trip.tripNumber}`} subtitle="Freight manifest, financial breakdown, and printable slip" />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trips List</span>
          </button>

          <div className="flex items-center gap-2">
            {trip.status === 'in_transit' && (
              <button
                onClick={() => setIsArrivalModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Arrival</span>
              </button>
            )}

            <Link
              href={`/trips/${trip.id}/print`}
              target="_blank"
              className="px-4 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent-500)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[var(--accent-500)]" />
              <span>Print Trip Slip</span>
            </Link>
          </div>
        </div>

        {/* Status Lifecycle Pipeline Bar */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">
              Trip Lifecycle Pipeline
            </span>
            <StatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {pipeline.map((step, idx) => {
              const isDone = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-full h-2 rounded-full mb-2 ${
                      isCurrent
                        ? 'bg-[var(--accent-500)] animate-pulse'
                        : isDone
                        ? 'bg-emerald-500'
                        : 'bg-[var(--bg-subtle)] border border-[var(--border-color)]'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-[var(--accent-500)]'
                        : isDone
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Manifest Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-color)] pb-3">
                Manifest Specifications
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    Assigned Truck
                  </span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    {trip.truckReg}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    Driver
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{trip.driverName}</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    Origin Facility
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{trip.origin}</span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    Destination Site
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{trip.destination}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    Cargo Details & Tonnage
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{trip.cargoDetails}</span>
                </div>

                {trip.operatorName && (
                  <div className="col-span-2 pt-2 border-t border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                      Subcontracted Operator
                    </span>
                    <span className="font-bold text-[var(--accent-500)]">{trip.operatorName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Physical & Form Details */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] space-y-4">
              <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-color)] pb-3">
                Physical Form Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">Start Meter Reading</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">{trip.startMeterReading || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">End Meter Reading</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">{trip.endMeterReading || 'N/A'}</span>
                </div>
                
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">Total Distance</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">
                    {trip.destinationKm ? `${trip.destinationKm} KM` : (
                      trip.startMeterReading && trip.endMeterReading 
                        ? `${trip.endMeterReading - trip.startMeterReading} KM` 
                        : 'N/A'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">
                    {truckVehicleType === 'tanker' ? 'Cargo Volume' : 'Cargo Weight'}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatCargoWeight(trip.cargoWeight, truckVehicleType)}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">Diesel Filled</span>
                  <span className="font-medium text-[var(--text-primary)]">{trip.dieselQuantity ? `${trip.dieselQuantity} L` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">UREA Filled</span>
                  <span className="font-medium text-[var(--text-primary)]">{trip.ureaQuantity ? `${trip.ureaQuantity} L` : 'N/A'}</span>
                </div>
                
                <div className="col-span-2 border-t border-[var(--border-color)] pt-2 mt-2">
                  <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">Helper(s)</span>
                  <span className="font-medium text-[var(--text-primary)]">{trip.helpers && trip.helpers.length > 0 ? trip.helpers.join(', ') : 'None'}</span>
                </div>

                {trip.customFields && Object.keys(trip.customFields).length > 0 && (
                  <div className="col-span-2 border-t border-[var(--border-color)] pt-3 mt-2 space-y-2">
                    <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">Custom fields</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(trip.customFields).map(([key, value]) => {
                        const label =
                          loadTripFormFields().find((f) => f.key === key)?.label ||
                          key.replace(/^custom_/, '').replace(/_/g, ' ')
                        return (
                          <div key={key}>
                            <span className="text-[var(--text-muted)] uppercase block text-[10px] font-semibold">{label}</span>
                            <span className="font-medium text-[var(--text-primary)]">{String(value)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Advances Allocation */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] space-y-3">
              <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">
                Driver Advances Issued Against Trip
              </h3>

              {advances.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No specific advance recorded for this trip.</p>
              ) : (
                <div className="space-y-2">
                  {advances.map((adv) => (
                    <div
                      key={adv.id}
                      className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs font-medium"
                    >
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{adv.purpose}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{adv.issuedAt}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-500">
                        ₹{adv.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial P&L Card */}
          <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-color)] pb-3">
                Financial Breakdown
              </h3>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-[var(--text-secondary)]">Total Freight:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    ₹{trip.freightAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between font-medium text-rose-500">
                  <span>− Fuel Expenses:</span>
                  <span className="font-mono">₹{trip.fuelExpenses.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between font-medium text-rose-500">
                  <span>− Toll & Misc:</span>
                  <span className="font-mono">₹{trip.otherExpenses.toLocaleString('en-IN')}</span>
                </div>

                {trip.hiredTruckPayout > 0 && (
                  <div className="flex justify-between font-medium text-amber-500">
                    <span>− Operator Payout:</span>
                    <span className="font-mono">₹{trip.hiredTruckPayout.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Net Trip Margin</span>
                <span
                  className={`text-2xl font-bold font-mono ${
                    trip.netProfit >= 0 ? 'text-[var(--accent-600)]' : 'text-rose-500'
                  }`}
                >
                  ₹{trip.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">
                {((trip.netProfit / (trip.freightAmount || 1)) * 100).toFixed(1)}% margin on freight
              </p>
            </div>
          </div>
        </div>
      </div>

      <ArrivalModal
        trip={trip}
        isOpen={isArrivalModalOpen}
        onClose={() => setIsArrivalModalOpen(false)}
        onSuccess={async () => {
          await reload()
          router.refresh()
        }}
      />
    </div>
  )
}
