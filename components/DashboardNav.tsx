"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Coins, Inbox, Landmark, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ITEMS = [
  { href: '/dashboard',    label: 'Overview',  icon: LayoutDashboard },
  { href: '/inbox',        label: 'Inbox',     icon: Inbox },
  { href: '/revenue',      label: 'Revenue',   icon: Wallet },
  { href: '/credits',      label: 'Credits',   icon: Coins },
  { href: '/bank-account', label: 'Payouts',   icon: Landmark },
]

export default function DashboardNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-16 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 py-2 scrollbar-none">
            {ITEMS.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Link href="/post" className="hidden sm:block shrink-0">
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Post</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
