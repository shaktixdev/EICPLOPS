import { NextResponse } from 'next/server'
import { listInvoices, createInvoice } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function GET() {
  try {
    const gate = await requirePermission('invoices')
    if (gate.error) return gate.error
    return NextResponse.json(await listInvoices())
  } catch (error: any) {
    console.error('GET /api/invoices', error)
    return NextResponse.json({ error: error.message || 'Failed to load invoices' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('invoices')
    if (gate.error) return gate.error
    const { customerName, tripIds, dueDate } = await req.json()
    if (!customerName || !Array.isArray(tripIds) || tripIds.length === 0) {
      return NextResponse.json({ error: 'customerName and tripIds required' }, { status: 400 })
    }
    return NextResponse.json(await createInvoice(customerName, tripIds, dueDate), { status: 201 })
  } catch (error: any) {
    console.error('POST /api/invoices', error)
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 })
  }
}
