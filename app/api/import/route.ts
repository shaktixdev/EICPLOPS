import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-auth'
import { importFromBuffer, type ImportKind } from '@/lib/data-import'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('masters_write')
    if (gate.error) return gate.error

    const form = await req.formData()
    const kind = String(form.get('type') || 'trucks') as ImportKind
    const file = form.get('file')

    if (!['trucks', 'drivers', 'trips'].includes(kind)) {
      return NextResponse.json({ error: 'type must be trucks, drivers, or trips' }, { status: 400 })
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Upload a CSV or Excel file' }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      return NextResponse.json({ error: 'File must be .csv, .xlsx, or .xls' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    const result = await importFromBuffer(kind, buffer)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('POST /api/import', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
