'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { Header } from '@/components/layout/header'
import {
  fetchTrips,
  fetchDrivers,
  fetchInvoices,
  type TripItem,
  type DriverItem,
  type InvoiceItem,
} from '@/lib/client-data'
import { useSession } from 'next-auth/react'
import { ArrivalModal } from '@/components/trips/arrival-modal'
import { usePermissions } from '@/hooks/use-permissions'

type ChartPeriod = 'daily' | 'weekly' | 'monthly'

function buildEngagementData(trips: TripItem[], period: ChartPeriod) {
  const counts = new Map<string, number>()
  const now = new Date()

  const inRange = (d: Date) => {
    if (period === 'daily') {
      return d.toDateString() === now.toDateString()
    }
    if (period === 'weekly') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return d >= start && d <= now
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }

  trips.forEach((t) => {
    const d = new Date(t.departureDate)
    if (!inRange(d)) return
    const key =
      period === 'daily'
        ? d.toLocaleTimeString('en-IN', { hour: 'numeric' })
        : period === 'weekly'
          ? d.toLocaleDateString('en-IN', { weekday: 'short' })
          : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  if (counts.size === 0) {
    const labels =
      period === 'daily'
        ? ['6am', '9am', '12pm', '3pm', '6pm', '9pm']
        : period === 'weekly'
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          : ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    return labels.map((name) => ({ name, value: 0, highlight: false }))
  }

  const entries = Array.from(counts.entries()).map(([name, value]) => ({ name, value, highlight: false }))
  const max = Math.max(...entries.map((e) => e.value), 0)
  return entries.map((e) => ({ ...e, highlight: e.value === max && max > 0 }))
}

function buildAdvanceTrend(trips: TripItem[]) {
  if (trips.length === 0) {
    return [
      { name: 'W1', value: 0 },
      { name: 'W2', value: 0 },
      { name: 'W3', value: 0 },
      { name: 'W4', value: 0 },
    ]
  }
  return [...trips]
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
    .slice(-6)
    .map((t, i) => ({
      name: `T${i + 1}`,
      value: t.advancesTotal || t.expenseGiven || 0,
    }))
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { can, roleLabel: currentRoleLabel } = usePermissions()
  const [trips, setTrips] = useState<TripItem[]>([])
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [period, setPeriod] = useState<ChartPeriod>('monthly')
  const [arrivalTrip, setArrivalTrip] = useState<TripItem | null>(null)

  const reload = useCallback(async () => {
    const [t, d] = await Promise.all([fetchTrips(), fetchDrivers()])
    setTrips(t)
    setDrivers(d)
    if (can('invoices')) {
      setInvoices(await fetchInvoices().catch(() => []))
    } else {
      setInvoices([])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — can() is stable by role via session

  useEffect(() => {
    reload().catch(console.error)
  }, [reload, session])
  const inTransit = trips.filter((t) => t.status === 'in_transit')
  const totalFreight = trips.reduce((a, t) => a + t.freightAmount, 0)
  const totalProfit = trips.reduce((a, t) => a + t.netProfit, 0)
  const totalAdvances = drivers.reduce((a, d) => a + d.advanceBalance, 0)
  const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const openInvoiceTotal = openInvoices.reduce((a, i) => a + i.totalAmount, 0)

  const chartData = useMemo(() => buildEngagementData(trips, period), [trips, period])
  const balanceTrend = useMemo(() => buildAdvanceTrend(trips), [trips])
  const thumbLeft = period === 'daily' ? '3px' : period === 'weekly' ? '33.33%' : '66.66%'
  const thumbWidth = 'calc(33.33% - 3px)'

  const recentTrips = useMemo(() => trips.slice(0, 5), [trips])
  const peak = chartData.find((d) => d.highlight)

  return (
    <>
      <Header showGreeting />
      <main className="px-6 pb-8 pt-2 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 stagger">
          {/* Hero fleet pulse card */}
          <div className="xl:col-span-3 surface-card-interactive">
            <div className="hero-card p-5 h-full flex flex-col min-h-[280px]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/70 text-xs font-medium mb-1">Fleet pulse</p>
                  <p className="text-3xl font-bold tracking-tight font-mono">
                    {inTransit.length}
                    <span className="text-base font-semibold text-white/70 ml-1">in transit</span>
                  </p>
                </div>
                <span className="material-symbols-outlined text-white/80">contactless</span>
              </div>
              <div className="mt-auto space-y-4">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-white/60 text-[11px]">Plant</p>
                    <p className="font-semibold">Eastern India Cement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[11px]">Gate</p>
                    <p className="font-semibold">Gate 2 · Live</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/15">
                  <p className="text-white/60 text-[11px] mb-1">Weekly revenue</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono">
                      ₹{totalFreight.toLocaleString('en-IN')}
                    </span>
                    {trips.length > 0 && (
                      <span className="badge-success bg-white/20 text-white">{trips.length} trips</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement / trip rate chart */}
          {can('analytics') && (
          <div className="xl:col-span-5 surface-card p-5 surface-card-interactive min-h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Trip engagement</h2>
                <p className="text-xs text-[var(--text-muted)]">Dispatch volume by period</p>
              </div>
              <div className="period-toggle min-w-[220px]">
                <span className="period-thumb" style={{ left: thumbLeft, width: thumbWidth }} />
                {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-active={period === p}
                    onClick={() => setPeriod(p)}
                    className="flex-1 capitalize"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[180px] relative">
              {peak && peak.value > 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span className="badge-success shadow-sm">
                    {peak.name} · {peak.value} trips
                  </span>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 28 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} trips`, 'Volume']}
                  />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.highlight ? 'var(--accent-600)' : 'var(--mint)'}
                        className="chart-bar"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          {/* Advances / balance card */}
          <div className={`${can('analytics') ? 'xl:col-span-4' : 'xl:col-span-9'} surface-card p-5 surface-card-interactive min-h-[280px] flex flex-col`}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Driver advances</p>
                <p className="text-3xl font-bold tracking-tight font-mono mt-1">
                  ₹{totalAdvances.toLocaleString('en-IN')}
                </p>
              </div>
              <button className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-600)] transition-colors">
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </button>
            </div>
            <div className="flex-1 min-h-[100px] my-2">
              {can('analytics') ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceTrend}>
                  <defs>
                    <linearGradient id="advFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-500)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--accent-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--accent-500)"
                    strokeWidth={2.5}
                    fill="url(#advFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <p>{inTransit.length} trucks currently in transit</p>
                  <p>{trips.length} trips in ledger</p>
                  <p>{drivers.length} drivers on roster</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-auto">
              {can('create_slip') && (
                <Link href="/trips/new" className="btn-primary flex-1">
                  <span className="material-symbols-outlined text-[16px]">north</span>
                  New trip
                </Link>
              )}
              {can('mark_arrived') && (
                <Link href="/trips?status=in_transit" className="btn-ghost flex-1">
                  <span className="material-symbols-outlined text-[16px]">south</span>
                  Mark arrival
                </Link>
              )}
              {!can('create_slip') && !can('mark_arrived') && (
                <Link href="/trips" className="btn-ghost flex-1">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View trips
                </Link>
              )}
            </div>
          </div>

          {/* Recent trips table */}
          <div className="xl:col-span-8 surface-card p-5 surface-card-interactive">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Gate pass history</h2>
                <p className="text-xs text-[var(--text-muted)]">Recent outward & inward movements</p>
              </div>
              <Link href="/trips" className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-600)] transition-colors">
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-3 font-semibold">Trip / Truck</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Freight</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {recentTrips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-[var(--text-muted)]">
                        No trips yet. Add fleet masters, then create a gate slip.
                      </td>
                    </tr>
                  ) : (
                    recentTrips.map((trip) => (
                      <tr key={trip.id} className="group">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--mint-soft)] text-[var(--accent-600)] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                            </div>
                            <div>
                              <Link href={`/trips/${trip.id}`} className="text-sm font-semibold hover:text-[var(--accent-600)] transition-colors">
                                {trip.tripNumber}
                              </Link>
                              <p className="text-xs text-[var(--text-muted)]">{trip.truckReg} · {trip.driverName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-sm text-[var(--text-secondary)]">
                          {new Date(trip.departureDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-600)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-500)]" />
                            {trip.status === 'in_transit' ? 'On road' : trip.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-sm font-semibold">
                          ₹{trip.freightAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-right">
                          {can('mark_arrived') && trip.status === 'in_transit' ? (
                            <button
                              type="button"
                              onClick={() => setArrivalTrip(trip)}
                              className="text-xs font-semibold text-[var(--accent-600)] hover:underline"
                            >
                              Arrive
                            </button>
                          ) : (
                            <Link
                              href={`/trips/${trip.id}/print`}
                              target="_blank"
                              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-600)]"
                            >
                              Slip
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit / invoices + crew */}
          <div className="xl:col-span-4 flex flex-col gap-5">
            {can('invoices') && (
            <div className="surface-card p-5 surface-card-interactive flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] font-medium">Open invoices</p>
                  <p className="text-2xl font-bold font-mono mt-1">
                    ₹{openInvoiceTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="badge-success">
                  {openInvoices.length} open
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Net trip profit this period: ₹{totalProfit.toLocaleString('en-IN')}
              </p>
              <Link href="/invoices" className="btn-ghost w-full">
                View invoicing
              </Link>
            </div>
            )}

            <div className="surface-card p-5 surface-card-interactive">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Active crew</h3>
                <Link href="/masters/drivers" className="text-xs font-semibold text-[var(--accent-600)]">
                  See all
                </Link>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Recent drivers on dispatch</p>
              <div className="flex items-center">
                {drivers.slice(0, 4).map((d, i) => (
                  <div
                    key={d.id}
                    className="w-10 h-10 rounded-full border-2 border-white bg-[var(--mint-soft)] text-[var(--accent-600)] flex items-center justify-center text-xs font-bold -ml-2 first:ml-0 shadow-sm"
                    style={{ zIndex: 10 - i }}
                    title={d.name}
                  >
                    {d.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                ))}
                {drivers.length > 4 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center justify-center text-xs font-bold -ml-2">
                    +{drivers.length - 4}
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Signed in as {currentRoleLabel}
                {session?.user?.name ? ` · ${session.user.name}` : ''}
              </p>
            </div>
          </div>
        </div>
      </main>

      <ArrivalModal
        trip={arrivalTrip}
        isOpen={Boolean(arrivalTrip)}
        onClose={() => setArrivalTrip(null)}
        onSuccess={reload}
      />
    </>
  )
}
