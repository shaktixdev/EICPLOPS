import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { listTrips, listInvoices, listTrucks, listDrivers } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'
import {
  AnalyticsPeriod,
  AnalyticsView,
  buildDriverAnalytics,
  buildTripAnalytics,
  buildTruckAnalytics,
  filterTripsByPeriod,
  getPeriodRange,
  rowsToCsv,
} from '@/lib/analytics'

function asPeriod(v: string | null): AnalyticsPeriod {
  if (v === 'daily' || v === 'weekly' || v === 'monthly') return v
  return 'monthly'
}

function asView(v: string | null): AnalyticsView {
  if (v === 'truck' || v === 'driver' || v === 'trip') return v
  return 'trip'
}

async function buildAnalyticsSheet(view: AnalyticsView, period: AnalyticsPeriod) {
  const range = getPeriodRange(period)
  const [allTrips, trucks, drivers] = await Promise.all([listTrips(), listTrucks(), listDrivers()])
  const trips = filterTripsByPeriod(allTrips, period)

  if (view === 'truck') {
    const rows = buildTruckAnalytics(trips, trucks)
    return {
      filenameBase: `analytics-truck-${period}`,
      sheetName: 'Truck wise',
      headers: ['Truck Reg', 'Ownership', 'Trips', 'Freight', 'Fuel', 'Net Profit', 'Avg Profit/Trip', 'Period'],
      rows: rows.map((r) => [
        r.label,
        r.ownership,
        r.trips,
        r.freight,
        r.fuel,
        r.profit,
        Math.round(r.avgProfit),
        range.label,
      ]),
    }
  }

  if (view === 'driver') {
    const rows = buildDriverAnalytics(trips, drivers)
    return {
      filenameBase: `analytics-driver-${period}`,
      sheetName: 'Driver wise',
      headers: ['Driver', 'Trips', 'Freight', 'Net Profit', 'Avg Profit/Trip', 'Advances', 'Period'],
      rows: rows.map((r) => [
        r.label,
        r.trips,
        r.freight,
        r.profit,
        Math.round(r.avgProfit),
        r.advances,
        range.label,
      ]),
    }
  }

  const rows = buildTripAnalytics(trips)
  return {
    filenameBase: `analytics-trip-${period}`,
    sheetName: 'Trip wise',
    headers: [
      'Trip Number',
      'Date',
      'Truck',
      'Driver',
      'Destination',
      'Status',
      'Freight',
      'Fuel',
      'Net Profit',
      'Period',
    ],
    rows: rows.map((r) => [
      r.label,
      new Date(r.date).toLocaleDateString('en-IN'),
      r.truck,
      r.driver,
      r.destination,
      r.status,
      r.freight,
      r.fuel,
      r.profit,
      range.label,
    ]),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'trips'
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    const period = asPeriod(searchParams.get('period'))
    const view = asView(searchParams.get('view'))

    const needed =
      type === 'analytics' ? 'analytics' : type === 'invoices' ? 'invoices' : 'view_trips'
    const gate = await requirePermission(needed as any)
    if (gate.error) return gate.error

    if (type === 'analytics') {
      const sheet = await buildAnalyticsSheet(view, period)
      const date = new Date().toISOString().split('T')[0]

      if (format === 'xlsx' || format === 'excel') {
        const wb = XLSX.utils.book_new()
        const aoa = [sheet.headers, ...sheet.rows]
        const ws = XLSX.utils.aoa_to_sheet(aoa)
        XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName)
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${sheet.filenameBase}-${date}.xlsx"`,
          },
        })
      }

      const csv = rowsToCsv(sheet.headers, sheet.rows)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${sheet.filenameBase}-${date}.csv"`,
        },
      })
    }

    if (type === 'invoices') {
      const invoices = await listInvoices()
      const headers = ['Invoice Number', 'Customer Name', 'Status', 'Total Amount', 'Due Date', 'Created At']
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.customerName,
        inv.status,
        inv.totalAmount,
        inv.dueDate,
        inv.createdAt,
      ])
      const date = new Date().toISOString().split('T')[0]

      if (format === 'xlsx' || format === 'excel') {
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="invoices-export-${date}.xlsx"`,
          },
        })
      }

      return new NextResponse(rowsToCsv(headers, rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="invoices-export-${date}.csv"`,
        },
      })
    }

    const trips = await listTrips()
    const headers = [
      'Trip Number',
      'Truck Reg',
      'Driver Name',
      'Origin',
      'Destination',
      'Cargo',
      'Freight',
      'Fuel',
      'Profit',
      'Status',
      'Departure Date',
    ]
    const rows = trips.map((t) => [
      t.tripNumber,
      t.truckReg,
      t.driverName,
      t.origin,
      t.destination,
      t.cargoDetails,
      t.freightAmount,
      t.fuelExpenses,
      t.netProfit,
      t.status,
      t.departureDate,
    ])
    const date = new Date().toISOString().split('T')[0]

    if (format === 'xlsx' || format === 'excel') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      XLSX.utils.book_append_sheet(wb, ws, 'Trips')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="trips-export-${date}.xlsx"`,
        },
      })
    }

    return new NextResponse(rowsToCsv(headers, rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="trips-export-${date}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('GET /api/export', error)
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 })
  }
}
