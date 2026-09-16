import { NextResponse } from 'next/server'
import { patchDriver, deleteDriver } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const isArchive = body.status === 'archived' || body.status === 'inactive'
    const gate = await requirePermission(isArchive ? 'delete_data' : 'masters_write')
    if (gate.error) return gate.error
    return NextResponse.json(await patchDriver(params.id, body))
  } catch (error: any) {
    console.error('PATCH /api/drivers/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const gate = await requirePermission('delete_data')
    if (gate.error) return gate.error
    return NextResponse.json(await deleteDriver(params.id))
  } catch (error: any) {
    console.error('DELETE /api/drivers/[id]', error)
    const message = error.message || 'Failed to delete driver'
    const status = message.includes('Cannot delete') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
