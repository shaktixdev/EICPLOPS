import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { createTruck, createDriver, createTrip, listTrucks, listDrivers } from '@/lib/db'

export type ImportKind = 'trucks' | 'drivers' | 'trips'

export type ImportResult = {
  kind: ImportKind
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

function normKey(k: string) {
  return String(k || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\w]/g, '')
}

function cell(row: Record<string, unknown>, ...aliases: string[]): string {
  const map = new Map<string, unknown>()
  for (const [k, v] of Object.entries(row)) map.set(normKey(k), v)
  for (const a of aliases) {
    const v = map.get(normKey(a))
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function num(row: Record<string, unknown>, ...aliases: string[]): number {
  const raw = cell(row, ...aliases)
  if (!raw) return 0
  const n = Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseSheet(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
}

export function buildTemplateWorkbook(kind: ImportKind): Buffer {
  const wb = XLSX.utils.book_new()
  let headers: string[]
  let sample: (string | number)[][]

  if (kind === 'trucks') {
    headers = ['registrationNumber', 'ownershipType', 'capacityTons', 'status', 'assignedDriverPhone']
    sample = [
      ['KA-04-MB-4821', 'owned', 30, 'active', '9876543210'],
      ['MH-12-AB-7734', 'hired', 25, 'active', ''],
    ]
  } else if (kind === 'drivers') {
    headers = ['name', 'phone', 'licenseNumber', 'licenseExpiry', 'status']
    sample = [
      ['Ramesh Patil', '9876543210', 'KA04-2019-4821', '2028-01-15', 'active'],
      ['Suresh Kulkarni', '9876501234', 'MH12-2020-7734', '2027-06-30', 'active'],
    ]
  } else {
    headers = [
      'truckReg',
      'driverPhone',
      'origin',
      'destination',
      'cargoDetails',
      'freightAmount',
      'fuelExpenses',
      'otherExpenses',
      'hiredTruckPayout',
      'status',
      'departureDate',
    ]
    sample = [
      [
        'KA-04-MB-4821',
        '9876543210',
        'Wadi Plant',
        'Bengaluru Depot',
        'PPC Cement 30 MT',
        50000,
        5000,
        1000,
        0,
        'in_transit',
        '2026-09-01',
      ],
    ]
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])
  XLSX.utils.book_append_sheet(wb, ws, kind)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export async function importFromBuffer(kind: ImportKind, buffer: Buffer): Promise<ImportResult> {
  const rows = parseSheet(buffer)
  if (rows.length === 0) {
    return { kind, created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'No data rows found' }] }
  }

  if (kind === 'trucks') return importTrucks(rows)
  if (kind === 'drivers') return importDrivers(rows)
  return importTrips(rows)
}

async function importDrivers(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: ImportResult['errors'] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    try {
      const name = cell(row, 'name', 'driver_name', 'driver')
      const phone = cell(row, 'phone', 'mobile', 'contact').replace(/\s+/g, '')
      if (!name || !phone) {
        skipped++
        errors.push({ row: rowNum, message: 'name and phone are required' })
        continue
      }

      const licenseNumber = cell(row, 'licenseNumber', 'license', 'license_number') || undefined
      const licenseExpiry = cell(row, 'licenseExpiry', 'license_expiry', 'expiry') || undefined
      const statusRaw = cell(row, 'status') || 'active'
      const status = ['active', 'inactive', 'archived'].includes(statusRaw) ? statusRaw : 'active'

      const existing = await prisma.driver.findFirst({ where: { phone } })
      if (existing) {
        await prisma.driver.update({
          where: { id: existing.id },
          data: {
            name,
            licenseNumber: licenseNumber || null,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
            status,
          },
        })
        updated++
      } else {
        await createDriver({
          name,
          phone,
          licenseNumber,
          licenseExpiry,
          status: status as 'active' | 'inactive' | 'archived',
          assignedTruckId: undefined,
          assignedTruckReg: undefined,
        })
        created++
      }
    } catch (err: any) {
      skipped++
      errors.push({ row: rowNum, message: err?.message || 'Failed to import driver' })
    }
  }

  return { kind: 'drivers', created, updated, skipped, errors }
}

async function importTrucks(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: ImportResult['errors'] = []
  const drivers = await listDrivers()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    try {
      const registrationNumber = cell(
        row,
        'registrationNumber',
        'registration',
        'reg',
        'truck_reg',
        'truckReg'
      ).toUpperCase()
      if (!registrationNumber) {
        skipped++
        errors.push({ row: rowNum, message: 'registrationNumber is required' })
        continue
      }

      const ownershipRaw = (cell(row, 'ownershipType', 'ownership') || 'owned').toLowerCase()
      const ownershipType = ownershipRaw === 'hired' ? 'hired' : 'owned'
      const capacityTons = num(row, 'capacityTons', 'capacity', 'tons') || 25
      const statusRaw = cell(row, 'status') || 'active'
      const status = ['active', 'maintenance', 'archived'].includes(statusRaw) ? statusRaw : 'active'

      const driverPhone = cell(row, 'assignedDriverPhone', 'driver_phone', 'driverPhone').replace(/\s+/g, '')
      const driverName = cell(row, 'assignedDriverName', 'driver_name', 'driverName')
      let assignedDriverId: string | undefined
      if (driverPhone) {
        assignedDriverId = drivers.find((d) => d.phone === driverPhone)?.id
      } else if (driverName) {
        assignedDriverId = drivers.find((d) => d.name.toLowerCase() === driverName.toLowerCase())?.id
      }

      const existing = await prisma.truck.findUnique({ where: { registrationNumber } })
      if (existing) {
        await prisma.truck.update({
          where: { id: existing.id },
          data: {
            ownershipType,
            capacityTons,
            status,
            ...(assignedDriverId !== undefined ? { assignedDriverId } : {}),
          },
        })
        updated++
      } else {
        await createTruck({
          registrationNumber,
          ownershipType,
          capacityTons,
          status: status as 'active' | 'maintenance' | 'archived',
          assignedDriverId,
          assignedDriverName: undefined,
        })
        created++
      }
    } catch (err: any) {
      skipped++
      errors.push({ row: rowNum, message: err?.message || 'Failed to import truck' })
    }
  }

  return { kind: 'trucks', created, updated, skipped, errors }
}

async function importTrips(rows: Record<string, unknown>[]): Promise<ImportResult> {
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: ImportResult['errors'] = []
  const [trucks, drivers] = await Promise.all([listTrucks(), listDrivers()])

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    try {
      const truckReg = cell(row, 'truckReg', 'truck', 'registration', 'registrationNumber').toUpperCase()
      const driverPhone = cell(row, 'driverPhone', 'driver_phone', 'phone').replace(/\s+/g, '')
      const driverName = cell(row, 'driverName', 'driver_name', 'driver')
      const origin = cell(row, 'origin', 'from') || 'Plant'
      const destination = cell(row, 'destination', 'to')
      const cargoDetails = cell(row, 'cargoDetails', 'cargo', 'material') || 'Cargo'
      const freightAmount = num(row, 'freightAmount', 'freight')
      const fuelExpenses = num(row, 'fuelExpenses', 'fuel')
      const otherExpenses = num(row, 'otherExpenses', 'other')
      const hiredTruckPayout = num(row, 'hiredTruckPayout', 'payout', 'hired_payout')
      const statusRaw = cell(row, 'status') || 'in_transit'
      const status = ['draft', 'in_transit', 'completed', 'invoiced', 'paid'].includes(statusRaw)
        ? statusRaw
        : 'in_transit'
      const departureDate =
        cell(row, 'departureDate', 'date', 'departure') || new Date().toISOString().slice(0, 10)

      const truck = trucks.find((t) => t.registrationNumber.toUpperCase() === truckReg)
      if (!truck) {
        skipped++
        errors.push({ row: rowNum, message: `Truck not found: ${truckReg || '(empty)'}` })
        continue
      }

      let driver = driverPhone ? drivers.find((d) => d.phone === driverPhone) : undefined
      if (!driver && driverName) {
        driver = drivers.find((d) => d.name.toLowerCase() === driverName.toLowerCase())
      }
      if (!driver && truck.assignedDriverId) {
        driver = drivers.find((d) => d.id === truck.assignedDriverId)
      }
      if (!driver) {
        skipped++
        errors.push({ row: rowNum, message: 'Driver not found (use driverPhone or driverName)' })
        continue
      }
      if (!destination) {
        skipped++
        errors.push({ row: rowNum, message: 'destination is required' })
        continue
      }

      await createTrip({
        truckId: truck.id,
        driverId: driver.id,
        operatorId: undefined,
        origin,
        destination,
        cargoDetails,
        freightAmount,
        fuelExpenses,
        otherExpenses,
        hiredTruckPayout,
        status: status as any,
        departureDate,
        arrivalDate: undefined,
        truckReg: truck.registrationNumber,
        driverName: driver.name,
        operatorName: undefined,
        startMeterReading: undefined,
        endMeterReading: undefined,
        destinationKm: undefined,
        cargoWeight: undefined,
        helpers: [],
        dieselQuantity: undefined,
        ureaQuantity: undefined,
        expenseGiven: undefined,
        expenseReturned: undefined,
        customFields: undefined,
      })
      created++
    } catch (err: any) {
      skipped++
      errors.push({ row: rowNum, message: err?.message || 'Failed to import trip' })
    }
  }

  return { kind: 'trips', created, updated, skipped, errors }
}
