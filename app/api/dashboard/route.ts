import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/db'
import { requirePermission } from '@/lib/api-auth'

export async function GET() {
  try {
    const gate = await requirePermission('view_trips')
    if (gate.error) return gate.error
    return NextResponse.json(await getDashboardStats())
  } catch (error: any) {
    console.error('GET /api/dashboard', error)
    return NextResponse.json({ error: error.message || 'Failed to load dashboard' }, { status: 500 })
  }
}
