import { NextResponse } from 'next/server'
import { patchInvoiceStatus } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const gate = await requirePermission('invoices')
    if (gate.error) return gate.error
    const { status } = await req.json()
    return NextResponse.json(await patchInvoiceStatus(params.id, status))
  } catch (error: any) {
    console.error('PATCH /api/invoices/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}
