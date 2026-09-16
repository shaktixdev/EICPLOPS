'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Header } from '@/components/layout/header'
import {
  fetchTrips,
  fetchTrucks,
  fetchDrivers,
  fetchInvoices,
  type TripItem,
  type TruckItem,
  type DriverItem,
  type InvoiceItem,
} from '@/lib/client-data'
import {
  AnalyticsPeriod,
  AnalyticsView,
  buildDriverAnalytics,
  buildTrend,
  buildTripAnalytics,
  buildTruckAnalytics,
  filterTripsByPeriod,
  getPeriodRange,
  summarizeTrips,
} from '@/lib/analytics'
import { RequirePermission } from '@/components/auth/require-permission'

const PERIODS: { id: AnalyticsPeriod; label: string; hint: string }[] = [
  { id: 'daily', label: 'Daily', hint: 'Today' },
  { id: 'weekly', label: 'Weekly', hint: 'This week' },
  { id: 'monthly', label: 'Monthly', hint: 'This month' },
]

const VIEWS: { id: AnalyticsView; label: string; icon: string }[] = [
  { id: 'truck', label: 'Truck wise', icon: 'local_shipping' },
  { id: 'driver', label: 'Driver wise', icon: 'badge' },
  { id: 'trip', label: 'Trip wise', icon: 'assignment' },
]

function money(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly')
  const [view, setView] = useState<AnalyticsView>('truck')
  const [allTrips, setAllTrips] = useState<TripItem[]>([])
  const [trucks, setTrucks] = useState<TruckItem[]>([])
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])

  useEffect(() => {
    Promise.all([fetchTrips(), fetchTrucks(), fetchDrivers(), fetchInvoices().catch(() => [])])
      .then(([t, tr, d, i]) => {
        setAllTrips(t)
        setTrucks(tr)
        setDrivers(d)
        setInvoices(i)
      })
      .catch(console.error)
  }, [])

  const range = useMemo(() => getPeriodRange(period), [period])
  const periodTrips = useMemo(() => filterTripsByPeriod(allTrips, period), [allTrips, period])
  const summary = useMemo(() => summarizeTrips(periodTrips), [periodTrips])
  const trend = useMemo(() => buildTrend(periodTrips, period), [periodTrips, period])

  const truckRows = useMemo(() => buildTruckAnalytics(periodTrips, trucks), [periodTrips, trucks])
  const driverRows = useMemo(() => buildDriverAnalytics(periodTrips, drivers), [periodTrips, drivers])
  const tripRows = useMemo(() => buildTripAnalytics(periodTrips), [periodTrips])
  const overdue = invoices.filter((i) => i.status === 'overdue')

  const exportUrl = (format: 'csv' | 'xlsx') =>
    `/api/export?type=analytics&view=${view}&period=${period}&format=${format}`

  return (
    <RequirePermission permission="analytics">
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Analytics & Insights"
        subtitle="Truck, driver, and trip performance — daily, weekly, and monthly"
      />

      <div className="px-6 pb-8 space-y-5">
        {/* Controls */}
        <div className="surface-card p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 animate-fade-up">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Time period
              </p>
              <div className="period-toggle inline-flex">
                <span
                  className="period-thumb"
                  style={{
                    left: period === 'daily' ? '3px' : period === 'weekly' ? '33.33%' : '66.66%',
                    width: 'calc(33.33% - 3px)',
                  }}
                />
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    data-active={period === p.id}
                    onClick={() => setPeriod(p.id)}
                    className="min-w-[88px]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">Showing: {range.label}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Breakdown
              </p>
              <div className="flex flex-wrap gap-2">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setView(v.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold transition-all ${
                      view === v.id
                        ? 'bg-[var(--accent-600)] text-white shadow-md shadow-[rgba(11,95,75,0.25)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{v.icon}</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={exportUrl('csv')} className="btn-ghost" download>
              <span className="material-symbols-outlined text-[18px]">csv</span>
              Export CSV
            </a>
            <a href={exportUrl('xlsx')} className="btn-primary" download>
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              Export Excel
            </a>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 stagger">
          {[
            { label: 'Trips', value: String(summary.trips), icon: 'assignment' },
            { label: 'Freight', value: money(summary.freight), icon: 'payments' },
            { label: 'Fuel cost', value: money(summary.fuel), icon: 'local_gas_station' },
            { label: 'Net profit', value: money(summary.profit), icon: 'trending_up' },
            { label: 'In transit', value: String(summary.inTransit), icon: 'route' },
          ].map((kpi) => (
            <div key={kpi.label} className="surface-card p-4 surface-card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {kpi.label}
                </span>
                <span className="material-symbols-outlined text-[18px] text-[var(--accent-500)]">{kpi.icon}</span>
              </div>
              <p className="text-xl font-bold font-mono tracking-tight">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div className="surface-card p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Performance trend</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {period === 'daily' ? 'Hourly buckets unavailable — trips by day label' : `${PERIODS.find((p) => p.id === period)?.label} trip volume & profit`}
              </p>
            </div>
          </div>
          {trend.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-[var(--text-muted)]">
              No trips in this period. Dispatch trips to populate analytics.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'trips' ? value : money(value),
                      name === 'trips' ? 'Trips' : name === 'profit' ? 'Profit' : name === 'freight' ? 'Freight' : 'Fuel',
                    ]}
                  />
                  <Bar dataKey="trips" fill="var(--mint)" radius={[8, 8, 8, 8]} name="trips" />
                  <Bar dataKey="profit" fill="var(--accent-600)" radius={[8, 8, 8, 8]} name="profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {trend.length > 0 && (
            <div className="h-28 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="freightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-500)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--accent-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: 12 }}
                    formatter={(v: number) => [money(v), 'Freight']}
                  />
                  <Area type="monotone" dataKey="freight" stroke="var(--accent-500)" fill="url(#freightFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Breakdown table */}
        <div className="surface-card overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold capitalize">{view} breakdown</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Filtered to {range.label} · export matches this table
              </p>
            </div>
            <div className="flex gap-2">
              <a href={exportUrl('csv')} className="btn-ghost h-9" download>
                CSV
              </a>
              <a href={exportUrl('xlsx')} className="btn-ghost h-9" download>
                Excel
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            {view === 'truck' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3 px-4">Truck</th>
                    <th className="py-3 px-4">Ownership</th>
                    <th className="py-3 px-4">Trips</th>
                    <th className="py-3 px-4 text-right">Freight</th>
                    <th className="py-3 px-4 text-right">Fuel</th>
                    <th className="py-3 px-4 text-right">Net profit</th>
                    <th className="py-3 px-4 text-right">Avg / trip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {truckRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                        No truck activity in this period.
                      </td>
                    </tr>
                  ) : (
                    truckRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--bg-elevated)]">
                        <td className="py-3 px-4 font-mono font-bold">{r.label}</td>
                        <td className="py-3 px-4 capitalize text-[var(--text-secondary)]">{r.ownership}</td>
                        <td className="py-3 px-4 font-mono">{r.trips}</td>
                        <td className="py-3 px-4 text-right font-mono">{money(r.freight)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">{money(r.fuel)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-600)]">{money(r.profit)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">{money(r.avgProfit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {view === 'driver' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Trips</th>
                    <th className="py-3 px-4 text-right">Freight</th>
                    <th className="py-3 px-4 text-right">Net profit</th>
                    <th className="py-3 px-4 text-right">Avg / trip</th>
                    <th className="py-3 px-4 text-right">Advances</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {driverRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[var(--text-muted)]">
                        No driver activity in this period.
                      </td>
                    </tr>
                  ) : (
                    driverRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--bg-elevated)]">
                        <td className="py-3 px-4 font-semibold">{r.label}</td>
                        <td className="py-3 px-4 font-mono">{r.trips}</td>
                        <td className="py-3 px-4 text-right font-mono">{money(r.freight)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-600)]">{money(r.profit)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">{money(r.avgProfit)}</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600">{money(r.advances)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {view === 'trip' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="py-3 px-4">Trip</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Truck</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Freight</th>
                    <th className="py-3 px-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {tripRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[var(--text-muted)]">
                        No trips in this period.
                      </td>
                    </tr>
                  ) : (
                    tripRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--bg-elevated)]">
                        <td className="py-3 px-4">
                          <Link href={`/trips/${r.id}`} className="font-mono font-bold hover:text-[var(--accent-600)]">
                            {r.label}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 font-mono">{r.truck}</td>
                        <td className="py-3 px-4">{r.driver}</td>
                        <td className="py-3 px-4 max-w-[160px] truncate">{r.destination}</td>
                        <td className="py-3 px-4 capitalize text-[var(--text-secondary)]">{r.status.replace('_', ' ')}</td>
                        <td className="py-3 px-4 text-right font-mono">{money(r.freight)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-600)]">{money(r.profit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {overdue.length > 0 && (
          <div className="p-5 rounded-3xl border border-rose-500/25 bg-rose-500/5 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Overdue invoices ({overdue.length})
            </div>
            <div className="space-y-2">
              {overdue.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-mono font-bold">{inv.invoiceNumber}</span>
                    <span className="text-[var(--text-secondary)] ml-2">— {inv.customerName}</span>
                  </div>
                  <span className="font-mono font-bold">{money(inv.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </RequirePermission>
  )
}
