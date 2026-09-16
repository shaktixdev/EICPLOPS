import { NextResponse } from 'next/server'
import { listOperators, createOperator } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const gate = await requirePermission('view_fleet')
    if (gate.error) return gate.error
    return NextResponse.json(await listOperators())
  } catch (error: any) {
    console.error('GET /api/operators', error)
    return NextResponse.json({ error: error.message || 'Failed to load operators' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('masters_write')
    if (gate.error) return gate.error
    const body = await req.json()
    return NextResponse.json(await createOperator(body), { status: 201 })
  } catch (error: any) {
    console.error('POST /api/operators', error)
    return NextResponse.json({ error: error.message || 'Failed to create operator' }, { status: 500 })
  }
}
