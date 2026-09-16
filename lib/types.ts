export interface TruckItem {
  id: string
  registrationNumber: string
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
