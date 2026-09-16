import { prisma } from '@/lib/prisma'
import type {
  TruckItem,
  DriverItem,
  OperatorItem,
  TripItem,
  AdvanceItem,
  LedgerItem,
  InvoiceItem,
} from '@/lib/types'

function dateStr(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toISOString().split('T')[0]
}

function isoStr(d: Date | string | null | undefined): string {
  if (!d) return ''
  return (typeof d === 'string' ? new Date(d) : d).toISOString()
}

export function mapTruck(t: any): TruckItem {
  return {
    id: t.id,
    registrationNumber: t.registrationNumber,
    vehicleType: (t.vehicleType || 'truck') as TruckItem['vehicleType'],
    ownershipType: t.ownershipType,
    capacityTons: t.capacityTons,
    status: t.status,
    assignedDriverId: t.assignedDriverId || undefined,
    assignedDriverName: t.assignedDriver?.name,
    createdAt: dateStr(t.createdAt),
  }
}

export function mapDriver(d: any): DriverItem {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    licenseNumber: d.licenseNumber || undefined,
    licenseExpiry: d.licenseExpiry ? dateStr(d.licenseExpiry) : undefined,
    assignedTruckId: d.assignedTruck?.id,
    assignedTruckReg: d.assignedTruck?.registrationNumber,
    status: d.status,
    advanceBalance: d.advanceBalance,
    createdAt: dateStr(d.createdAt),
  }
}

export function mapOperator(o: any): OperatorItem {
  return {
    id: o.id,
    name: o.name,
    contactPhone: o.contactPhone,
    gstNumber: o.gstNumber || undefined,
    status: o.status,
    runningBalance: o.runningBalance,
    createdAt: dateStr(o.createdAt),
  }
}

export function mapTrip(t: any): TripItem {
  return {
    id: t.id,
    tripNumber: t.tripNumber,
    truckId: t.truckId,
    truckReg: t.truck?.registrationNumber || '',
    driverId: t.driverId,
    driverName: t.driver?.name || '',
    operatorId: t.operatorId || undefined,
    operatorName: t.operator?.name,
    origin: t.origin,
    destination: t.destination,
    cargoDetails: t.cargoDetails,
    freightAmount: t.freightAmount,
    fuelExpenses: t.fuelExpenses,
    otherExpenses: t.otherExpenses,
    hiredTruckPayout: t.hiredTruckPayout,
    status: t.status,
    departureDate: isoStr(t.departureDate) || dateStr(t.departureDate),
    arrivalDate: t.arrivalDate ? isoStr(t.arrivalDate) : undefined,
    netProfit: t.netProfit,
    advancesTotal: t.advancesTotal,
    startMeterReading: t.startMeterReading ?? undefined,
    endMeterReading: t.endMeterReading ?? undefined,
    destinationKm: t.destinationKm ?? undefined,
    cargoWeight: t.cargoWeight ?? undefined,
    helpers: t.helpers || undefined,
    dieselQuantity: t.dieselQuantity ?? undefined,
    ureaQuantity: t.ureaQuantity ?? undefined,
    expenseGiven: t.expenseGiven ?? undefined,
    expenseReturned: t.expenseReturned ?? undefined,
    customFields: (t.customFields as Record<string, string | number>) || undefined,
  }
}

export function mapAdvance(a: any): AdvanceItem {
  return {
    id: a.id,
    driverId: a.driverId,
    driverName: a.driver?.name || '',
    tripId: a.tripId || undefined,
    tripNumber: a.trip?.tripNumber,
    amount: a.amount,
    purpose: a.purpose,
    settled: a.settled,
    issuedAt: dateStr(a.issuedAt),
  }
}

export function mapLedger(e: any): LedgerItem {
  return {
    id: e.id,
    operatorId: e.operatorId,
    operatorName: e.operator?.name || '',
    amount: e.amount,
    type: e.type,
    reference: e.reference,
    notes: e.notes || undefined,
    timestamp: isoStr(e.timestamp),
  }
}

export function mapInvoice(inv: any): InvoiceItem {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    status: inv.status,
    totalAmount: inv.totalAmount,
    dueDate: dateStr(inv.dueDate),
    paidAt: inv.paidAt ? dateStr(inv.paidAt) : undefined,
    createdAt: dateStr(inv.createdAt),
    tripIds: (inv.lines || []).map((l: any) => l.tripId),
    tripNumbers: (inv.lines || []).map((l: any) => l.trip?.tripNumber || l.description),
  }
}

async function nextCounter(name: string, prefix: string, pad = 4) {
  const counter = await prisma.counter.upsert({
    where: { id: name },
    create: { id: name, seq: 1 },
    update: { seq: { increment: 1 } },
  })
  return `${prefix}-${String(counter.seq).padStart(pad, '0')}`
}

export async function listTrucks(): Promise<TruckItem[]> {
  const rows = await prisma.truck.findMany({
    include: { assignedDriver: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapTruck)
}

export async function createTruck(data: Omit<TruckItem, 'id' | 'createdAt'>) {
  if (data.assignedDriverId) {
    const previous = await prisma.truck.findMany({
      where: { assignedDriverId: data.assignedDriverId },
    })
    for (const t of previous) {
      await prisma.truck.update({
        where: { id: t.id },
        data: { assignedDriverId: null },
      })
    }
  }

  const truck = await prisma.truck.create({
    data: {
      registrationNumber: data.registrationNumber,
      vehicleType: data.vehicleType || 'truck',
      ownershipType: data.ownershipType,
      capacityTons: data.capacityTons,
      status: data.status,
      assignedDriverId: data.assignedDriverId || null,
    },
    include: { assignedDriver: true },
  })
  return mapTruck(truck)
}

export async function patchTruck(id: string, update: Partial<TruckItem>) {
  if (update.assignedDriverId) {
    const previous = await prisma.truck.findMany({
      where: { assignedDriverId: update.assignedDriverId, NOT: { id } },
    })
    for (const t of previous) {
      await prisma.truck.update({
        where: { id: t.id },
        data: { assignedDriverId: null },
      })
    }
  }

  const truck = await prisma.truck.update({
    where: { id },
    data: {
      ...(update.registrationNumber !== undefined && { registrationNumber: update.registrationNumber }),
      ...(update.vehicleType !== undefined && { vehicleType: update.vehicleType }),
      ...(update.ownershipType !== undefined && { ownershipType: update.ownershipType }),
      ...(update.capacityTons !== undefined && { capacityTons: update.capacityTons }),
      ...(update.status !== undefined && { status: update.status }),
      ...(update.assignedDriverId !== undefined && { assignedDriverId: update.assignedDriverId || null }),
    },
    include: { assignedDriver: true },
  })
  return mapTruck(truck)
}

export async function deleteTruck(id: string) {
  const trips = await prisma.trip.count({ where: { truckId: id } })
  if (trips > 0) {
    throw new Error('Cannot delete truck with trip history. Archive it instead.')
  }
  await prisma.truck.update({ where: { id }, data: { assignedDriverId: null } })
  await prisma.truck.delete({ where: { id } })
  return { ok: true }
}

export async function patchDriver(
  id: string,
  update: Partial<Omit<DriverItem, 'id' | 'createdAt' | 'advanceBalance'>>
) {
  await prisma.driver.update({
    where: { id },
    data: {
      ...(update.name !== undefined && { name: update.name }),
      ...(update.phone !== undefined && { phone: update.phone }),
      ...(update.licenseNumber !== undefined && {
        licenseNumber: update.licenseNumber?.trim() || null,
      }),
      ...(update.licenseExpiry !== undefined && {
        licenseExpiry: update.licenseExpiry ? new Date(update.licenseExpiry) : null,
      }),
      ...(update.status !== undefined && { status: update.status }),
    },
  })

  if (update.assignedTruckId !== undefined) {
    // Clear this driver from any truck
    const previous = await prisma.truck.findMany({ where: { assignedDriverId: id } })
    for (const t of previous) {
      await prisma.truck.update({
        where: { id: t.id },
        data: { assignedDriverId: null },
      })
    }
    if (update.assignedTruckId) {
      await prisma.truck.update({
        where: { id: update.assignedTruckId },
        data: { assignedDriverId: id },
      })
    }
  }

  const withTruck = await prisma.driver.findUnique({
    where: { id },
    include: { assignedTruck: true },
  })
  return mapDriver(withTruck!)
}

export async function deleteDriver(id: string) {
  const trips = await prisma.trip.count({ where: { driverId: id } })
  if (trips > 0) {
    throw new Error('Cannot delete driver with trip history. Set status to inactive/archived instead.')
  }
  const advances = await prisma.advance.count({ where: { driverId: id } })
  if (advances > 0) {
    throw new Error('Cannot delete driver with advance records. Set status to inactive instead.')
  }
  await prisma.truck.updateMany({
    where: { assignedDriverId: id },
    data: { assignedDriverId: null },
  })
  await prisma.driver.delete({ where: { id } })
  return { ok: true }
}

export async function listDrivers(): Promise<DriverItem[]> {
  const rows = await prisma.driver.findMany({
    include: { assignedTruck: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapDriver)
}

export async function createDriver(
  data: Omit<DriverItem, 'id' | 'createdAt' | 'advanceBalance'>
) {
  const driver = await prisma.driver.create({
    data: {
      name: data.name,
      phone: data.phone,
      licenseNumber: data.licenseNumber?.trim() || null,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      status: data.status,
    },
    include: { assignedTruck: true },
  })

  if (data.assignedTruckId) {
    // One driver per truck — clear this driver from any other truck first
    const previous = await prisma.truck.findMany({
      where: { assignedDriverId: driver.id },
    })
    for (const t of previous) {
      await prisma.truck.update({
        where: { id: t.id },
        data: { assignedDriverId: null },
      })
    }
    await prisma.truck.update({
      where: { id: data.assignedTruckId },
      data: { assignedDriverId: driver.id },
    })
  }

  const withTruck = await prisma.driver.findUnique({
    where: { id: driver.id },
    include: { assignedTruck: true },
  })
  return mapDriver(withTruck!)
}

export async function listOperators(): Promise<OperatorItem[]> {
  const rows = await prisma.operator.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(mapOperator)
}

export async function createOperator(
  data: Omit<OperatorItem, 'id' | 'createdAt' | 'runningBalance'>
) {
  const op = await prisma.operator.create({
    data: {
      name: data.name,
      contactPhone: data.contactPhone,
      gstNumber: data.gstNumber || null,
      status: data.status,
    },
  })
  return mapOperator(op)
}

export async function listTrips(): Promise<TripItem[]> {
  const rows = await prisma.trip.findMany({
    include: { truck: true, driver: true, operator: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapTrip)
}

export async function createTrip(
  data: Omit<TripItem, 'id' | 'tripNumber' | 'netProfit' | 'advancesTotal'>
) {
  const tripNumber = await nextCounter('trip', `TRIP-${new Date().getFullYear()}`)
  const netProfit =
    data.freightAmount - data.fuelExpenses - data.otherExpenses - data.hiredTruckPayout

  const trip = await prisma.trip.create({
    data: {
      tripNumber,
      truckId: data.truckId,
      driverId: data.driverId,
      operatorId: data.operatorId || null,
      origin: data.origin,
      destination: data.destination,
      cargoDetails: data.cargoDetails,
      freightAmount: data.freightAmount,
      fuelExpenses: data.fuelExpenses,
      otherExpenses: data.otherExpenses,
      hiredTruckPayout: data.hiredTruckPayout,
      status: data.status,
      departureDate: new Date(data.departureDate),
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      netProfit,
      advancesTotal: 0,
      startMeterReading: data.startMeterReading ?? null,
      endMeterReading: data.endMeterReading ?? null,
      destinationKm: data.destinationKm ?? null,
      cargoWeight: data.cargoWeight ?? null,
      helpers: data.helpers || [],
      dieselQuantity: data.dieselQuantity ?? null,
      ureaQuantity: data.ureaQuantity ?? null,
      expenseGiven: data.expenseGiven ?? null,
      expenseReturned: data.expenseReturned ?? null,
      customFields: data.customFields || undefined,
    },
    include: { truck: true, driver: true, operator: true },
  })
  return mapTrip(trip)
}

export async function patchTrip(id: string, update: Partial<TripItem>) {
  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) throw new Error('Trip not found')

  const freightAmount = update.freightAmount ?? existing.freightAmount
  const fuelExpenses = update.fuelExpenses ?? existing.fuelExpenses
  const otherExpenses = update.otherExpenses ?? existing.otherExpenses
  const hiredTruckPayout = update.hiredTruckPayout ?? existing.hiredTruckPayout
  const netProfit = freightAmount - fuelExpenses - otherExpenses - hiredTruckPayout

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      ...(update.truckId !== undefined && { truckId: update.truckId }),
      ...(update.driverId !== undefined && { driverId: update.driverId }),
      ...(update.operatorId !== undefined && { operatorId: update.operatorId || null }),
      ...(update.origin !== undefined && { origin: update.origin }),
      ...(update.destination !== undefined && { destination: update.destination }),
      ...(update.cargoDetails !== undefined && { cargoDetails: update.cargoDetails }),
      ...(update.freightAmount !== undefined && { freightAmount: update.freightAmount }),
      ...(update.fuelExpenses !== undefined && { fuelExpenses: update.fuelExpenses }),
      ...(update.otherExpenses !== undefined && { otherExpenses: update.otherExpenses }),
      ...(update.hiredTruckPayout !== undefined && { hiredTruckPayout: update.hiredTruckPayout }),
      ...(update.status !== undefined && { status: update.status }),
      ...(update.departureDate !== undefined && { departureDate: new Date(update.departureDate) }),
      ...(update.arrivalDate !== undefined && {
        arrivalDate: update.arrivalDate ? new Date(update.arrivalDate) : null,
      }),
      ...(update.startMeterReading !== undefined && { startMeterReading: update.startMeterReading }),
      ...(update.endMeterReading !== undefined && { endMeterReading: update.endMeterReading }),
      ...(update.destinationKm !== undefined && { destinationKm: update.destinationKm }),
      ...(update.cargoWeight !== undefined && { cargoWeight: update.cargoWeight }),
      ...(update.helpers !== undefined && { helpers: update.helpers }),
      ...(update.dieselQuantity !== undefined && { dieselQuantity: update.dieselQuantity }),
      ...(update.ureaQuantity !== undefined && { ureaQuantity: update.ureaQuantity }),
      ...(update.expenseGiven !== undefined && { expenseGiven: update.expenseGiven }),
      ...(update.expenseReturned !== undefined && { expenseReturned: update.expenseReturned }),
      ...(update.customFields !== undefined && { customFields: update.customFields }),
      netProfit,
    },
    include: { truck: true, driver: true, operator: true },
  })
  return mapTrip(trip)
}

export async function listAdvances(): Promise<AdvanceItem[]> {
  const rows = await prisma.advance.findMany({
    include: { driver: true, trip: true },
    orderBy: { issuedAt: 'desc' },
  })
  return rows.map(mapAdvance)
}

export async function createAdvance(data: Omit<AdvanceItem, 'id' | 'issuedAt' | 'settled'>) {
  const advance = await prisma.$transaction(async (tx) => {
    const adv = await tx.advance.create({
      data: {
        driverId: data.driverId,
        tripId: data.tripId || null,
        amount: data.amount,
        purpose: data.purpose,
        settled: false,
      },
      include: { driver: true, trip: true },
    })
    await tx.driver.update({
      where: { id: data.driverId },
      data: { advanceBalance: { increment: data.amount } },
    })
    if (data.tripId) {
      await tx.trip.update({
        where: { id: data.tripId },
        data: { advancesTotal: { increment: data.amount } },
      })
    }
    return adv
  })
  return mapAdvance(advance)
}

export async function listLedger(): Promise<LedgerItem[]> {
  const rows = await prisma.ledgerEntry.findMany({
    include: { operator: true },
    orderBy: { timestamp: 'desc' },
  })
  return rows.map(mapLedger)
}

export async function createLedgerEntry(data: Omit<LedgerItem, 'id' | 'timestamp'>) {
  const entry = await prisma.$transaction(async (tx) => {
    const led = await tx.ledgerEntry.create({
      data: {
        operatorId: data.operatorId,
        amount: data.amount,
        type: data.type,
        reference: data.reference,
        notes: data.notes || null,
      },
      include: { operator: true },
    })
    await tx.operator.update({
      where: { id: data.operatorId },
      data: {
        runningBalance:
          data.type === 'charge' ? { increment: data.amount } : { decrement: data.amount },
      },
    })
    return led
  })
  return mapLedger(entry)
}

export async function listInvoices(): Promise<InvoiceItem[]> {
  const rows = await prisma.invoice.findMany({
    include: { lines: { include: { trip: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapInvoice)
}

export async function createInvoice(customerName: string, tripIds: string[], dueDate?: string) {
  const trips = await prisma.trip.findMany({ where: { id: { in: tripIds } } })
  const totalAmount = trips.reduce((acc, t) => acc + t.freightAmount, 0)
  const invoiceNumber = await nextCounter('invoice', `INV-${new Date().getFullYear()}`)

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerName,
        status: 'sent',
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 86400000),
        lines: {
          create: trips.map((t) => ({
            tripId: t.id,
            description: `${t.tripNumber} · ${t.origin} → ${t.destination}`,
            amount: t.freightAmount,
          })),
        },
      },
      include: { lines: { include: { trip: true } } },
    })
    await tx.trip.updateMany({
      where: { id: { in: tripIds } },
      data: { status: 'invoiced' },
    })
    return inv
  })
  return mapInvoice(invoice)
}

export async function patchInvoiceStatus(id: string, status: InvoiceItem['status']) {
  const inv = await prisma.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === 'paid' ? { paidAt: new Date() } : {}),
    },
    include: { lines: { include: { trip: true } } },
  })
  if (status === 'paid') {
    const tripIds = inv.lines.map((l) => l.tripId)
    await prisma.trip.updateMany({
      where: { id: { in: tripIds } },
      data: { status: 'paid' },
    })
  }
  return mapInvoice(inv)
}

export async function getDashboardStats() {
  const [trucks, drivers, trips, invoices, advances] = await Promise.all([
    prisma.truck.count({ where: { status: 'active' } }),
    prisma.driver.count({ where: { status: 'active' } }),
    prisma.trip.findMany(),
    prisma.invoice.findMany(),
    prisma.advance.findMany({ where: { settled: false } }),
  ])

  const inTransit = trips.filter((t) => t.status === 'in_transit').length
  const completed = trips.filter((t) => t.status === 'completed' || t.status === 'invoiced' || t.status === 'paid')
  const totalFreight = completed.reduce((a, t) => a + t.freightAmount, 0)
  const totalProfit = completed.reduce((a, t) => a + t.netProfit, 0)
  const outstandingInvoices = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((a, i) => a + i.totalAmount, 0)
  const openAdvances = advances.reduce((a, adv) => a + adv.amount, 0)

  return {
    activeTrucks: trucks,
    activeDrivers: drivers,
    inTransitTrips: inTransit,
    totalFreight,
    totalProfit,
    outstandingInvoices,
    openAdvances,
  }
}
