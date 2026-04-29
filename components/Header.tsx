"use client"
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, Menu, X, Plus, LayoutDashboard, LogIn, UserPlus, Coins, LogOut, User } from 'lucide-react'
import { FimiLogo } from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import type { User as SBUser } from '@supabase/supabase-js'

const NAV = [
  { href: '/', label: 'Discover' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<SBUser | null>(null)
  const [credits, setCredits] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('credits').eq('id', user.id).single()
          .then(({ data }) => { if (data) setCredits(data.credits) })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/60 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center h-16 gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
            <FimiLogo />
            <span className="font-bold text-lg tracking-tight leading-none">
              Fimi<span className="text-primary">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname === href ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
                {label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ad spaces, products, services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 rounded-xl border border-border/60 focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/post" className="hidden sm:block">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Post Ad Space
              </Button>
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/credits">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    <span className="font-bold text-accent">{credits}</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Button>
                </Link>
                <div className="relative group">
                  <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
                    {initials}
                  </button>
                  <div className="absolute right-0 top-10 w-40 glass rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors">
                      <User className="w-3.5 h-3.5" /> Profile
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors w-full text-left text-destructive">
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Register
                  </Button>
                </Link>
              </div>
            )}

            <button className="sm:hidden p-2 rounded-xl hover:bg-muted/60 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden pb-4 pt-2 flex flex-col gap-3 border-t border-border/60 animate-in-up">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search ad spaces..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </form>
            <div className="flex gap-2">
              <Link href="/post" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full gap-1"><Plus className="w-4 h-4" /> Post Ad Space</Button>
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm"><LayoutDashboard className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
