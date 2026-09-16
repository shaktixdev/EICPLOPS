import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { resetSystemToDefaults } from '@/lib/system-reset'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const gate = await requirePermission('delete_data')
    if (gate.error) return gate.error

    const body = await req.json().catch(() => ({}))
    const confirm = String(body.confirm || '').trim()
    const password = String(body.password || '')

    if (confirm !== 'RESET') {
      return NextResponse.json(
        { error: 'Type RESET to confirm factory reset' },
        { status: 400 }
      )
    }
    if (!password) {
      return NextResponse.json({ error: 'Admin password is required' }, { status: 400 })
    }

    const userId = (gate.session?.user as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const ok = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password

    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }

    const result = await resetSystemToDefaults()

    return NextResponse.json({
      ok: true,
      message: 'System reset to defaults',
      ...result,
    })
  } catch (error: any) {
    console.error('POST /api/system/reset', error)
    return NextResponse.json({ error: error.message || 'Failed to reset system' }, { status: 500 })
  }
}
