import { NextResponse } from 'next/server'
import { listBanks } from '@/lib/paystack'

export const revalidate = 86400

export async function GET() {
  try {
    const banks = await listBanks('nigeria')
    return NextResponse.json({ banks })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch banks' }, { status: 500 })
  }
}
