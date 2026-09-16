import { NextResponse } from 'next/server'
import { patchTruck } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const isArchive = body.status === 'archived'
    const gate = await requirePermission(isArchive ? 'delete_data' : 'masters_write')
    if (gate.error) return gate.error
    return NextResponse.json(await patchTruck(params.id, body))
  } catch (error: any) {
    console.error('PATCH /api/trucks/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to update truck' }, { status: 500 })
  }
}
