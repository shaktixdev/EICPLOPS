import { NextResponse } from 'next/server'
import { patchTrip } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const isArrival = body.status === 'completed'
    const gate = await requirePermission(isArrival ? 'mark_arrived' : 'masters_write')
    if (gate.error) return gate.error
    return NextResponse.json(await patchTrip(params.id, body))
  } catch (error: any) {
    console.error('PATCH /api/trips/[id]', error)
    return NextResponse.json({ error: error.message || 'Failed to update trip' }, { status: 500 })
  }
}
