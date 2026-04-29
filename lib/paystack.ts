const PAYSTACK_BASE = 'https://api.paystack.co'

function authHeader() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export interface Bank {
  name: string
  code: string
  slug: string
}

export async function listBanks(country = 'nigeria'): Promise<Bank[]> {
  const res = await fetch(`${PAYSTACK_BASE}/bank?country=${country}`, {
    headers: authHeader(),
    next: { revalidate: 86400 },
  })
  const json = await res.json()
  if (!json?.status) throw new Error(json?.message || 'Failed to fetch banks')
  return (json.data as any[]).map(b => ({ name: b.name, code: b.code, slug: b.slug }))
}

export async function resolveAccountNumber(account_number: string, bank_code: string) {
  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    { headers: authHeader() }
  )
  const json = await res.json()
  if (!json?.status) throw new Error(json?.message || 'Could not verify account number')
  return { account_name: json.data.account_name as string, account_number: json.data.account_number as string }
}

export async function createSubaccount(input: {
  business_name: string
  settlement_bank: string
  account_number: string
  percentage_charge: number
  primary_contact_email?: string
  primary_contact_name?: string
  primary_contact_phone?: string
}) {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!json?.status) throw new Error(json?.message || 'Could not create subaccount')
  return json.data as { subaccount_code: string; account_name: string; bank_name: string }
}

export async function initializeTransaction(input: {
  email: string
  amount_kobo: number
  reference: string
  callback_url: string
  metadata?: Record<string, any>
  subaccount?: string
  bearer?: 'account' | 'subaccount'
  transaction_charge?: number
}) {
  const body: Record<string, any> = {
    email: input.email,
    amount: input.amount_kobo,
    reference: input.reference,
    callback_url: input.callback_url,
  }
  if (input.metadata) body.metadata = input.metadata
  if (input.subaccount) {
    body.subaccount = input.subaccount
    body.bearer = input.bearer || 'subaccount'
    if (typeof input.transaction_charge === 'number') body.transaction_charge = input.transaction_charge
  }
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json?.status) throw new Error(json?.message || 'Could not initialize transaction')
  return json.data as { authorization_url: string; access_code: string; reference: string }
}

export const PLATFORM_FEE_PERCENT = 5
export const NAIRA_PER_KOBO = 0.01
export function nairaToKobo(naira: number) {
  return Math.round(naira * 100)
}
export function koboToNaira(kobo: number) {
  return kobo / 100
}
