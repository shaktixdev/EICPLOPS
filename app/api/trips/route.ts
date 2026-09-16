import { NextResponse } from 'next/server'
import { listTrips, createTrip } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function GET() {
  try {
    const gate = await requirePermission('view_trips')
    if (gate.error) return gate.error
    return NextResponse.json(await listTrips())
  } catch (error: any) {
    console.error('GET /api/trips', error)
    return NextResponse.json({ error: error.message || 'Failed to load trips' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('create_slip')
    if (gate.error) return gate.error
    const body = await req.json()
    return NextResponse.json(await createTrip(body), { status: 201 })
  } catch (error: any) {
    console.error('POST /api/trips', error)
    return NextResponse.json({ error: error.message || 'Failed to create trip' }, { status: 500 })
  }
}
