import type { DriverItem, TripItem, TruckItem } from '@/lib/types'

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'
export type AnalyticsView = 'truck' | 'driver' | 'trip'

export interface PeriodRange {
  start: Date
  end: Date
  label: string
}

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Inclusive period window ending at `anchor` (default now). */
export function getPeriodRange(period: AnalyticsPeriod, anchor = new Date()): PeriodRange {
  const end = endOfDay(anchor)
  const start = startOfDay(anchor)

  if (period === 'daily') {
    return {
      start,
      end,
      label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
  }

  if (period === 'weekly') {
    const day = start.getDay() || 7 // Mon=1 … Sun=7
    start.setDate(start.getDate() - (day - 1))
    return {
      start: startOfDay(start),
      end,
      label: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    }
  }

  // monthly
  start.setDate(1)
  return {
    start: startOfDay(start),
    end,
    label: start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  }
}

export function filterTripsByPeriod(trips: TripItem[], period: AnalyticsPeriod, anchor = new Date()) {
  const { start, end } = getPeriodRange(period, anchor)
  return trips.filter((t) => {
    const d = new Date(t.departureDate)
    return d >= start && d <= end
  })
}

export function bucketKey(dateIso: string, period: AnalyticsPeriod) {
  const d = new Date(dateIso)
  if (period === 'daily') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }
  if (period === 'weekly') {
    const start = startOfDay(d)
    const day = start.getDay() || 7
    start.setDate(start.getDate() - (day - 1))
    return `W ${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
  }
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export interface TrendPoint {
  name: string
  trips: number
  freight: number
  profit: number
  fuel: number
}

export function buildTrend(trips: TripItem[], period: AnalyticsPeriod): TrendPoint[] {
  const map = new Map<string, TrendPoint>()
  const ordered = [...trips].sort(
    (a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
  )

  ordered.forEach((t) => {
    const name = bucketKey(t.departureDate, period)
    const cur = map.get(name) || { name, trips: 0, freight: 0, profit: 0, fuel: 0 }
    cur.trips += 1
    cur.freight += t.freightAmount
    cur.profit += t.netProfit
    cur.fuel += t.fuelExpenses
    map.set(name, cur)
  })

  return Array.from(map.values())
}

export interface TruckAnalyticsRow {
  id: string
  label: string
  ownership: string
  trips: number
  freight: number
  fuel: number
  profit: number
  avgProfit: number
}

export interface DriverAnalyticsRow {
  id: string
  label: string
  trips: number
  freight: number
  profit: number
  advances: number
  avgProfit: number
}

export interface TripAnalyticsRow {
  id: string
  label: string
  truck: string
  driver: string
  destination: string
  status: string
  freight: number
  fuel: number
  profit: number
  date: string
}

export function buildTruckAnalytics(trips: TripItem[], trucks: TruckItem[]): TruckAnalyticsRow[] {
  const rows: TruckAnalyticsRow[] = trucks.map((truck) => {
    const list = trips.filter((t) => t.truckId === truck.id || t.truckReg === truck.registrationNumber)
    const freight = list.reduce((a, t) => a + t.freightAmount, 0)
    const fuel = list.reduce((a, t) => a + t.fuelExpenses, 0)
    const profit = list.reduce((a, t) => a + t.netProfit, 0)
    return {
      id: truck.id,
      label: truck.registrationNumber,
      ownership: truck.ownershipType,
      trips: list.length,
      freight,
      fuel,
      profit,
      avgProfit: list.length ? profit / list.length : 0,
    }
  })

  // Include orphan trip trucks not in master
  trips.forEach((t) => {
    if (!rows.some((r) => r.id === t.truckId || r.label === t.truckReg)) {
      const list = trips.filter((x) => x.truckReg === t.truckReg)
      const freight = list.reduce((a, x) => a + x.freightAmount, 0)
      const fuel = list.reduce((a, x) => a + x.fuelExpenses, 0)
      const profit = list.reduce((a, x) => a + x.netProfit, 0)
      rows.push({
        id: t.truckId || t.truckReg,
        label: t.truckReg,
        ownership: '—',
        trips: list.length,
        freight,
        fuel,
        profit,
        avgProfit: list.length ? profit / list.length : 0,
      })
    }
  })

  return rows.sort((a, b) => b.profit - a.profit)
}

export function buildDriverAnalytics(trips: TripItem[], drivers: DriverItem[]): DriverAnalyticsRow[] {
  const rows = drivers.map((driver) => {
    const list = trips.filter((t) => t.driverId === driver.id || t.driverName === driver.name)
    const freight = list.reduce((a, t) => a + t.freightAmount, 0)
    const profit = list.reduce((a, t) => a + t.netProfit, 0)
    return {
      id: driver.id,
      label: driver.name,
      trips: list.length,
      freight,
      profit,
      advances: driver.advanceBalance,
      avgProfit: list.length ? profit / list.length : 0,
    }
  })

  return rows.sort((a, b) => b.profit - a.profit)
}

export function buildTripAnalytics(trips: TripItem[]): TripAnalyticsRow[] {
  return [...trips]
    .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime())
    .map((t) => ({
      id: t.id,
      label: t.tripNumber,
      truck: t.truckReg,
      driver: t.driverName,
      destination: t.destination,
      status: t.status,
      freight: t.freightAmount,
      fuel: t.fuelExpenses,
      profit: t.netProfit,
      date: t.departureDate,
    }))
}

export function summarizeTrips(trips: TripItem[]) {
  const freight = trips.reduce((a, t) => a + t.freightAmount, 0)
  const fuel = trips.reduce((a, t) => a + t.fuelExpenses, 0)
  const profit = trips.reduce((a, t) => a + t.netProfit, 0)
  const inTransit = trips.filter((t) => t.status === 'in_transit').length
  return {
    trips: trips.length,
    freight,
    fuel,
    profit,
    inTransit,
    avgProfit: trips.length ? profit / trips.length : 0,
  }
}

export function rowsToCsv(headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
}
