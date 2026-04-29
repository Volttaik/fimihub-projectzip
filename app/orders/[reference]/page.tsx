import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG')}`

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('*, ad:ads(title, media)')
    .eq('paystack_reference', reference)
    .single()

  if (!order) notFound()

  const status = order.status as string
  const statusUI = status === 'paid'
    ? { label: 'Payment received', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' }
    : status === 'pending'
    ? { label: 'Payment pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' }
    : { label: 'Payment failed', icon: XCircle, color: 'text-red-600 bg-red-100' }
  const Icon = statusUI.icon

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="glass rounded-3xl p-8 shadow-md text-center">
        <div className={`w-16 h-16 rounded-full ${statusUI.color} flex items-center justify-center mx-auto mb-4`}>
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-1">{statusUI.label}</h1>
        <p className="text-sm text-muted-foreground">Reference: {order.paystack_reference}</p>

        <div className="text-left mt-6 space-y-3 border-t border-border/60 pt-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item</span>
            <span className="font-medium text-right max-w-[60%] truncate">{order.ad_title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">{order.quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buyer</span>
            <span className="font-medium">{order.buyer_name}</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-border/60">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{naira(order.amount_kobo)}</span>
          </div>
        </div>

        {status === 'pending' && (
          <p className="text-xs text-muted-foreground mt-5">If you completed payment, this page will update once Paystack confirms it. You can safely close it.</p>
        )}

        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/"><Button variant="outline" size="sm">Browse marketplace</Button></Link>
          {order.ad_id && <Link href={`/ad/${order.ad_id}`}><Button size="sm">View ad</Button></Link>}
        </div>
      </div>
    </div>
  )
}
