import type {
  TruckItem,
  DriverItem,
  OperatorItem,
  TripItem,
  AdvanceItem,
  LedgerItem,
  InvoiceItem,
} from '@/lib/types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchTrucks(): Promise<TruckItem[]> {
  return request('/api/trucks')
}

export async function createTruckApi(data: Omit<TruckItem, 'id' | 'createdAt'>) {
  return request<TruckItem>('/api/trucks', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateTruckApi(id: string, update: Partial<TruckItem>) {
  return request<TruckItem>(`/api/trucks/${id}`, { method: 'PATCH', body: JSON.stringify(update) })
}

export async function fetchDrivers(): Promise<DriverItem[]> {
  return request('/api/drivers')
}

export async function createDriverApi(
  data: Omit<DriverItem, 'id' | 'createdAt' | 'advanceBalance'>
) {
  return request<DriverItem>('/api/drivers', { method: 'POST', body: JSON.stringify(data) })
}

export async function fetchOperators(): Promise<OperatorItem[]> {
  return request('/api/operators')
}

export async function createOperatorApi(
  data: Omit<OperatorItem, 'id' | 'createdAt' | 'runningBalance'>
) {
  return request<OperatorItem>('/api/operators', { method: 'POST', body: JSON.stringify(data) })
}

export async function fetchTrips(): Promise<TripItem[]> {
  return request('/api/trips')
}

export async function createTripApi(
  data: Omit<TripItem, 'id' | 'tripNumber' | 'netProfit' | 'advancesTotal'>
) {
  return request<TripItem>('/api/trips', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateTripApi(id: string, update: Partial<TripItem>) {
  return request<TripItem>(`/api/trips/${id}`, { method: 'PATCH', body: JSON.stringify(update) })
}

export async function fetchAdvances(): Promise<AdvanceItem[]> {
  return request('/api/advances')
}

export async function createAdvanceApi(data: Omit<AdvanceItem, 'id' | 'issuedAt' | 'settled'>) {
  return request<AdvanceItem>('/api/advances', { method: 'POST', body: JSON.stringify(data) })
}

export async function fetchLedger(): Promise<LedgerItem[]> {
  return request('/api/ledger')
}

export async function createLedgerApi(data: Omit<LedgerItem, 'id' | 'timestamp'>) {
  return request<LedgerItem>('/api/ledger', { method: 'POST', body: JSON.stringify(data) })
}

export async function fetchInvoices(): Promise<InvoiceItem[]> {
  return request('/api/invoices')
}

export async function createInvoiceApi(customerName: string, tripIds: string[], dueDate?: string) {
  return request<InvoiceItem>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify({ customerName, tripIds, dueDate }),
  })
}

export async function updateInvoiceStatusApi(id: string, status: InvoiceItem['status']) {
  return request<InvoiceItem>(`/api/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function fetchDashboardStats() {
  return request<{
    activeTrucks: number
    activeDrivers: number
    inTransitTrips: number
    totalFreight: number
    totalProfit: number
    outstandingInvoices: number
    openAdvances: number
  }>('/api/dashboard')
}

export type {
  TruckItem,
  DriverItem,
  OperatorItem,
  TripItem,
  AdvanceItem,
  LedgerItem,
  InvoiceItem,
}
