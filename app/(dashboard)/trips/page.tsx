'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { StatusBadge } from '@/components/ui/status-badge'
import { fetchTrips, type TripItem } from '@/lib/client-data'
import { ArrivalModal } from '@/components/trips/arrival-modal'
import { usePermissions } from '@/hooks/use-permissions'

export default function TripsPage() {
  const { can } = usePermissions()
  const [trips, setTrips] = useState<TripItem[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [arrivalTrip, setArrivalTrip] = useState<TripItem | null>(null)

  const refreshTrips = async () => {
    setTrips(await fetchTrips())
  }

  useEffect(() => {
    refreshTrips().catch(console.error)
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const status = params.get('status')
    if (q) setSearch(q)
    if (status) setFilterStatus(status)
  }, [])

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.tripNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.truckReg.toLowerCase().includes(search.toLowerCase()) ||
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Dispatch & Trip Ledger" subtitle="Freight tracking, gate slips, and arrival completion" />

      <div className="px-6 pb-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-up">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trip, truck, driver…"
                className="input-field pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="in_transit">In transit</option>
              <option value="completed">Completed</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {can('create_slip') && (
            <Link href="/trips/new" className="btn-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create new trip
            </Link>
          )}
        </div>

        <div className="surface-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.06s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3.5 px-5">Trip number</th>
                  <th className="py-3.5 px-5">Truck & driver</th>
                  <th className="py-3.5 px-5">Route & cargo</th>
                  <th className="py-3.5 px-5">Freight</th>
                  <th className="py-3.5 px-5">Net profit</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                      No trips found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-[var(--bg-elevated)] transition-colors group">
                      <td className="py-4 px-5">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="font-semibold font-mono text-[var(--text-primary)] group-hover:text-[var(--accent-600)] transition-colors"
                        >
                          {trip.tripNumber}
                        </Link>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {new Date(trip.departureDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold block">{trip.truckReg}</span>
                        <span className="text-xs text-[var(--text-muted)]">{trip.driverName}</span>
                      </td>
                      <td className="py-4 px-5 max-w-[200px]">
                        <p className="font-semibold truncate">{trip.destination}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{trip.cargoDetails}</p>
                      </td>
                      <td className="py-4 px-5 font-mono font-medium">
                        ₹{trip.freightAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5 font-mono font-medium text-[var(--accent-600)]">
                        ₹{trip.netProfit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={trip.status} />
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        {can('mark_arrived') && trip.status === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => setArrivalTrip(trip)}
                            className="px-3 py-1.5 rounded-full bg-[var(--mint-soft)] hover:bg-[color-mix(in_srgb,var(--mint)_40%,white)] text-[var(--accent-600)] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Arrived
                          </button>
                        )}
                        <Link href={`/trips/${trip.id}/print`} target="_blank" className="btn-ghost h-8" title="Print trip slip">
                          <span className="material-symbols-outlined text-[14px]">print</span>
                          Slip
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ArrivalModal
        trip={arrivalTrip}
        isOpen={Boolean(arrivalTrip)}
        onClose={() => setArrivalTrip(null)}
        onSuccess={refreshTrips}
      />
    </div>
  )
}
