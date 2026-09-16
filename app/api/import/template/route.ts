import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-auth'
import { buildTemplateWorkbook, type ImportKind } from '@/lib/data-import'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const gate = await requirePermission('masters_write')
    if (gate.error) return gate.error

    const { searchParams } = new URL(req.url)
    const kind = (searchParams.get('type') || 'trucks') as ImportKind
    if (!['trucks', 'drivers', 'trips'].includes(kind)) {
      return NextResponse.json({ error: 'type must be trucks, drivers, or trips' }, { status: 400 })
    }

    const format = (searchParams.get('format') || 'xlsx').toLowerCase()
    const buf = buildTemplateWorkbook(kind)
    const date = new Date().toISOString().split('T')[0]

    if (format === 'csv') {
      // Re-read as CSV via xlsx
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buf, { type: 'buffer' })
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="import-template-${kind}-${date}.csv"`,
        },
      })
    }

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="import-template-${kind}-${date}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('GET /api/import/template', error)
    return NextResponse.json({ error: error.message || 'Failed to build template' }, { status: 500 })
  }
}
