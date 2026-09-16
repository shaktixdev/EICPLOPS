export type VehicleType = 'truck' | 'tanker' | 'tipper' | 'trailer' | 'container' | 'other'

export const VEHICLE_TYPES: Array<{ id: VehicleType; label: string }> = [
  { id: 'truck', label: 'Truck' },
  { id: 'tanker', label: 'Tanker' },
  { id: 'tipper', label: 'Tipper' },
  { id: 'trailer', label: 'Trailer' },
  { id: 'container', label: 'Container' },
  { id: 'other', label: 'Other' },
]

export function vehicleTypeLabel(type?: string | null): string {
  const found = VEHICLE_TYPES.find((v) => v.id === type)
  return found?.label || 'Truck'
}

export function normalizeVehicleType(type?: string | null): VehicleType {
  const t = String(type || 'truck')
    .toLowerCase()
    .trim()
  if (VEHICLE_TYPES.some((v) => v.id === t)) return t as VehicleType
  return 'truck'
}

/** Tankers carry liquid — capacity / cargo measured in litres; others in metric tons. */
export function usesLiquidCapacity(vehicleType?: string | null): boolean {
  return normalizeVehicleType(vehicleType) === 'tanker'
}

export function capacityUnit(vehicleType?: string | null): 'L' | 'MT' {
  return usesLiquidCapacity(vehicleType) ? 'L' : 'MT'
}

export function capacityUnitLabel(vehicleType?: string | null): string {
  return usesLiquidCapacity(vehicleType) ? 'Litres' : 'Tons'
}

export function capacityFieldLabel(vehicleType?: string | null): string {
  return usesLiquidCapacity(vehicleType) ? 'Capacity (Litres)' : 'Capacity (Metric Tons)'
}

export function formatCapacity(capacity: number, vehicleType?: string | null): string {
  const n = Number(capacity)
  if (!Number.isFinite(n)) return '—'
  if (usesLiquidCapacity(vehicleType)) return `${n.toLocaleString('en-IN')} L`
  return `${n} Tons`
}

export function defaultCapacity(vehicleType?: string | null): number {
  return usesLiquidCapacity(vehicleType) ? 20000 : 30
}

export function cargoWeightLabel(vehicleType?: string | null): string {
  return usesLiquidCapacity(vehicleType) ? 'Cargo Volume (Litres)' : 'Cargo Weight (MT)'
}

export function formatCargoWeight(weight?: number | null, vehicleType?: string | null): string {
  if (weight === null || weight === undefined || !Number.isFinite(Number(weight))) return 'N/A'
  const n = Number(weight)
  return usesLiquidCapacity(vehicleType)
    ? `${n.toLocaleString('en-IN')} L`
    : `${n} MT`
}

export interface TruckItem {
  id: string
  registrationNumber: string
  vehicleType: VehicleType
  ownershipType: 'owned' | 'hired'
  capacityTons: number
  status: 'active' | 'maintenance' | 'archived'
  assignedDriverId?: string
  assignedDriverName?: string
  createdAt: string
}

export interface DriverItem {
  id: string
  name: string
  phone: string
  licenseNumber?: string
  licenseExpiry?: string
  assignedTruckId?: string
  assignedTruckReg?: string
  status: 'active' | 'inactive' | 'archived'
  advanceBalance: number
  createdAt: string
}

export interface OperatorItem {
  id: string
  name: string
  contactPhone: string
  gstNumber?: string
  status: 'active' | 'archived'
  runningBalance: number
  createdAt: string
}

export interface TripItem {
  id: string
  tripNumber: string
  truckId: string
  truckReg: string
  driverId: string
  driverName: string
  operatorId?: string
  operatorName?: string
  origin: string
  destination: string
  cargoDetails: string
  freightAmount: number
  fuelExpenses: number
  otherExpenses: number
  hiredTruckPayout: number
  status: 'draft' | 'in_transit' | 'completed' | 'invoiced' | 'paid'
  departureDate: string
  arrivalDate?: string
  netProfit: number
  advancesTotal: number
  startMeterReading?: number
  endMeterReading?: number
  destinationKm?: number
  cargoWeight?: number
  helpers?: string[]
  dieselQuantity?: number
  ureaQuantity?: number
  expenseGiven?: number
  expenseReturned?: number
  customFields?: Record<string, string | number>
}

export interface AdvanceItem {
  id: string
  driverId: string
  driverName: string
  tripId?: string
  tripNumber?: string
  amount: number
  purpose: string
  settled: boolean
  issuedAt: string
}

export interface LedgerItem {
  id: string
  operatorId: string
  operatorName: string
  amount: number
  type: 'charge' | 'payment'
  reference: string
  notes?: string
  timestamp: string
}

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  customerName: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  totalAmount: number
  dueDate: string
  paidAt?: string
  createdAt: string
  tripIds: string[]
  tripNumbers: string[]
}
