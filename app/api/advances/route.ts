import { NextResponse } from 'next/server'
import { listAdvances, createAdvance } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function GET() {
  try {
    const gate = await requirePermission('view_fleet')
    if (gate.error) return gate.error
    return NextResponse.json(await listAdvances())
  } catch (error: any) {
    console.error('GET /api/advances', error)
    return NextResponse.json({ error: error.message || 'Failed to load advances' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('masters_write')
    if (gate.error) return gate.error
    const body = await req.json()
    return NextResponse.json(await createAdvance(body), { status: 201 })
  } catch (error: any) {
    console.error('POST /api/advances', error)
    return NextResponse.json({ error: error.message || 'Failed to create advance' }, { status: 500 })
  }
}
