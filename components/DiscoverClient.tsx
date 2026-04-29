"use client"
import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { X, ShoppingBag, Wrench, Home, Briefcase, TrendingUp, Search, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PostCard from '@/components/PostCard'
import type { Ad, Category } from '@/lib/supabase/types'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'products' as Category, label: 'Products', icon: ShoppingBag },
  { id: 'services' as Category, label: 'Services', icon: Wrench },
  { id: 'rentals' as Category, label: 'Rentals', icon: Home },
  { id: 'business' as Category, label: 'Business', icon: Briefcase },
]

const TRENDING = ['iPhone', 'Apartment Lagos', 'Web Design', 'Sony Camera', 'Logo Design', 'Gym']
const SORT_OPTIONS = [
  { value: 'recent', label: 'Latest first' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'price_asc', label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
]

export default function DiscoverClient({ initialAds }: { initialAds: Ad[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sort, setSort] = useState('recent')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') as Category | null

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    router.push(`/?${params.toString()}`)
  }

  const filtered = useMemo(() => {
    let list = [...initialAds]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
        a.location.toLowerCase().includes(q)
      )
    }
    if (category) list = list.filter(a => a.category === category)
    if (priceMin) list = list.filter(a => a.price !== null && a.price >= Number(priceMin))
    if (priceMax) list = list.filter(a => a.price !== null && a.price <= Number(priceMax))
    if (sort === 'price_asc') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sort === 'price_desc') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else if (sort === 'popular') list.sort((a, b) => b.views - a.views)
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [initialAds, query, category, priceMin, priceMax, sort])

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
          {/* Category tabs */}
          <div className="glass rounded-2xl p-2.5 mb-3 shadow-sm flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setParam('category', null)}
              className={`text-sm px-4 py-1.5 rounded-xl font-medium transition-all duration-200 ${!category ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
              All
            </button>
            {CATEGORIES.map(cat => {
              const CatIcon = cat.icon
              return (
                <button key={cat.id} onClick={() => setParam('category', cat.id)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-xl font-medium transition-all duration-200 ${category === cat.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              )
            })}
            <div className="ml-auto flex items-center gap-2">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-xs border border-border/70 rounded-xl px-3 py-1.5 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 ${showFilters ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border/70 hover:bg-muted/60 text-muted-foreground'}`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="glass rounded-2xl p-4 mb-3 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-semibold mb-2 block">Price Range (₦)</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                    className="w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring" />
                  <span className="text-muted-foreground shrink-0">–</span>
                  <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                    className="w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
              {(priceMin || priceMax) && (
                <button onClick={() => { setPriceMin(''); setPriceMax('') }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          )}

          {query && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs glass rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Results for</span>
                <span className="font-semibold">"{query}"</span>
                <button onClick={() => setParam('q', null)} className="text-muted-foreground hover:text-foreground ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3 px-0.5">
            <span className="font-semibold text-foreground">{filtered.length}</span> ad spaces
          </p>

          {filtered.length === 0 ? (
            <div className="glass rounded-2xl text-center py-20 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold">No ad spaces found</p>
              <p className="text-sm text-muted-foreground mt-1">Try different filters or be the first to post!</p>
              <Link href="/post" className="inline-block mt-4">
                <Button size="sm" className="gap-1.5">Post an Ad Space</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(ad => <PostCard key={ad.id} ad={ad} />)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24">
          <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Ready to advertise?</span>
            </div>
            <p className="text-xs opacity-75 mb-4 leading-relaxed">Post your ad space free and reach thousands of buyers today.</p>
            <Link href="/post">
              <Button variant="secondary" size="sm" className="w-full font-semibold shadow-sm">Post an Ad Space</Button>
            </Link>
          </div>

          <div className="glass rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm">Boost your ad</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">Use credits to boost your ad to the top of results.</p>
            <Link href="/credits">
              <Button variant="outline" size="sm" className="w-full text-xs">Buy Credits</Button>
            </Link>
          </div>

          <div className="glass rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Trending Searches</span>
            </div>
            <div className="flex flex-col">
              {TRENDING.map((term, i) => (
                <button key={term} onClick={() => setParam('q', term)}
                  className="flex items-center gap-3 text-left py-2 px-2 rounded-xl hover:bg-muted/60 transition-all group">
                  <span className="text-xs font-bold text-muted-foreground w-4 group-hover:text-primary">{i + 1}</span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{term}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 shadow-sm">
            <span className="font-semibold text-sm block mb-3">Categories</span>
            <div className="flex flex-col gap-0.5">
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon
                const count = initialAds.filter(a => a.category === cat.id).length
                return (
                  <button key={cat.id} onClick={() => setParam('category', cat.id)}
                    className={`flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all text-left ${category === cat.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>
                    <CatIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm flex-1">{cat.label}</span>
                    <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 font-medium">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
