import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createSubaccount, resolveAccountNumber, listBanks, PLATFORM_FEE_PERCENT } from '@/lib/paystack'
import pool from '@/lib/db'

export async function POST(req: Request) {
  const user = await getUserFromRequest(req as any)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bank_code, account_number, business_name } = await req.json()
  if (!bank_code || !account_number || !business_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const resolved = await resolveAccountNumber(account_number, bank_code)
    const banks = await listBanks('nigeria')
    const bank = banks.find((b: any) => b.code === bank_code)
    if (!bank) return NextResponse.json({ error: 'Invalid bank' }, { status: 400 })

    const sub = await createSubaccount({
      business_name,
      settlement_bank: bank_code,
      account_number: resolved.account_number,
      percentage_charge: PLATFORM_FEE_PERCENT,
      primary_contact_email: user.email,
    })

    await pool.query(
      `UPDATE profiles SET paystack_subaccount_code=$1, bank_name=$2, bank_code=$3, account_number=$4, account_name=$5 WHERE id=$6`,
      [sub.subaccount_code, bank.name, bank_code, resolved.account_number, resolved.account_name, user.id]
    )

    return NextResponse.json({
      ok: true,
      account_name: resolved.account_name,
      bank_name: bank.name,
      subaccount_code: sub.subaccount_code,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to connect bank account' }, { status: 500 })
  }
}
