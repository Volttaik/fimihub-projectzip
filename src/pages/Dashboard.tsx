import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Eye, MessageSquare, Heart, TrendingUp, Clock, CheckCircle2, XCircle, BarChart2 } from 'lucide-react';
import { useAuth } from 'zite-auth-sdk';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { label: 'My Listings',   value: '7',      icon: BarChart2,      change: '+2 this week' },
  { label: 'Total Views',   value: '2,841',  icon: Eye,            change: '+18% vs last month' },
  { label: 'Saved by users',value: '134',    icon: Heart,          change: '+12 this week' },
  { label: 'Messages',      value: '23',     icon: MessageSquare,  change: '5 unread' },
];

const DUMMY_LISTINGS = [
  { id: '1', title: 'MacBook Pro 14" M3', price: '$1,450', status: 'active',  views: 342, category: 'Products' },
  { id: '3', title: 'Modern 2BR Apartment', price: '$850/mo', status: 'active',  views: 520, category: 'Rentals' },
  { id: '2', title: 'Logo & Brand Design', price: '$120',    status: 'pending', views: 189, category: 'Services' },
  { id: '8', title: 'ZapFit Gym Promo',   price: '$40/mo',  status: 'active',  views: 312, category: 'Business' },
];

const RECENT_ACTIVITY = [
  { icon: Eye,           text: 'Your MacBook listing got 34 new views', time: '2h ago' },
  { icon: MessageSquare, text: 'New message on "2BR Apartment" listing', time: '5h ago' },
  { icon: TrendingUp,    text: '"Logo Design" listing featured on homepage', time: '1d ago' },
  { icon: Heart,         text: '12 users saved your "ZapFit" ad', time: '2d ago' },
];

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700',   icon: <Clock className="w-3 h-3" /> },
  sold:    { label: 'Sold',    className: 'bg-muted text-muted-foreground',   icon: <XCircle className="w-3 h-3" /> },
};

export default function Dashboard() {
  const { user, isLoading, loginWithRedirect } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      loginWithRedirect({ redirectUrl: window.location.href });
    }
  }, [user, isLoading, loginWithRedirect]);

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.firstName || user.email.split('@')[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your ads.</p>
        </div>
        <Link to="/post">
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> New Ad
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">My Listings</h2>
              <Link to="/post" className="text-xs text-primary hover:underline">+ New listing</Link>
            </div>
            <div className="divide-y divide-border">
              {DUMMY_LISTINGS.map(l => {
                const s = statusConfig[l.status] || statusConfig.active;
                return (
                  <div key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{l.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">{l.price}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Eye className="w-3 h-3" /> {l.views}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${s.className}`}>
                      {s.icon} {s.label}
                    </span>
                    <Link to={`/listing/${l.id}`} className="text-xs text-muted-foreground hover:text-foreground shrink-0 transition-colors">
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link to="/?q=" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all listings
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ACTIVITY.map(({ icon: Icon, text, time }, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-card border border-border rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link to="/post"><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Plus className="w-3.5 h-3.5" /> Post a New Ad</Button></Link>
              <Link to="/"><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Eye className="w-3.5 h-3.5" /> Browse Marketplace</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
