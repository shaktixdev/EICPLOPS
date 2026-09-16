import { NextResponse } from 'next/server'
import { listDrivers, createDriver } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function GET() {
  try {
    const gate = await requirePermission('view_fleet')
    if (gate.error) return gate.error
    return NextResponse.json(await listDrivers())
  } catch (error: any) {
    console.error('GET /api/drivers', error)
    return NextResponse.json({ error: error.message || 'Failed to load drivers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('masters_write')
    if (gate.error) return gate.error
    const body = await req.json()
    return NextResponse.json(await createDriver(body), { status: 201 })
  } catch (error: any) {
    console.error('POST /api/drivers', error)
    return NextResponse.json({ error: error.message || 'Failed to create driver' }, { status: 500 })
  }
}
