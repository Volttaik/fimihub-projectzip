import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, Plus, LayoutGrid, Info, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from 'zite-auth-sdk';

const NAV = [
  { to: '/',     label: 'Discover', icon: LayoutGrid },
  { to: '/home', label: 'About',    icon: Info },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithRedirect, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/70 backdrop-blur-md border-b border-border/60 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center h-16 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">FimiHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${location.pathname === to ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ads, products, services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 backdrop-blur-sm rounded-xl border border-border/60 focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-all"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/post" className="hidden sm:block">
              <Button size="sm" className="gap-1.5 rounded-xl shadow-sm">
                <Plus className="w-4 h-4" /> Post Ad
              </Button>
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/70">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Button>
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                  title="Sign out"
                >
                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/70">
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 pt-2 flex flex-col gap-3 border-t border-border/60">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${location.pathname === to ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-muted/60'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Link to="/post" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full gap-1 rounded-xl"><Plus className="w-4 h-4" /> Post Ad</Button>
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="gap-1 rounded-xl"><LayoutDashboard className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => logout()}>Logout</Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="rounded-xl">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="rounded-xl">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
