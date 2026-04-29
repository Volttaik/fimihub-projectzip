import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null, priceType: string): string {
  if (priceType === 'free') return 'Free'
  if (price === null) return 'Contact for price'
  const p = `₦${price.toLocaleString()}`
  if (priceType === 'per_month') return `${p} / mo`
  if (priceType === 'per_hour') return `${p} / hr`
  if (priceType === 'negotiable') return `${p} (Negotiable)`
  return p
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getSiteUrl(req?: Request): string {
  if (typeof window !== 'undefined') return window.location.origin
  if (req) {
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    return `${proto}://${host}`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.REPL_SLUG && process.env.REPL_OWNER)
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  return 'http://localhost:3000'
}
