import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubaccount, resolveAccountNumber, listBanks, PLATFORM_FEE_PERCENT } from '@/lib/paystack'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bank_code, account_number, business_name } = await req.json()
  if (!bank_code || !account_number || !business_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const resolved = await resolveAccountNumber(account_number, bank_code)
    const banks = await listBanks('nigeria')
    const bank = banks.find(b => b.code === bank_code)
    if (!bank) return NextResponse.json({ error: 'Invalid bank' }, { status: 400 })

    const sub = await createSubaccount({
      business_name,
      settlement_bank: bank_code,
      account_number: resolved.account_number,
      percentage_charge: PLATFORM_FEE_PERCENT,
      primary_contact_email: user.email!,
    })

    const { error } = await supabase.from('profiles').update({
      paystack_subaccount_code: sub.subaccount_code,
      bank_name: bank.name,
      bank_code,
      account_number: resolved.account_number,
      account_name: resolved.account_name,
    }).eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
