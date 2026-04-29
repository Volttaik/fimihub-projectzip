import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap, ShoppingBag, Wrench, Home as HomeIcon, Briefcase, Users, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { icon: ShoppingBag, label: 'Products', desc: 'Buy & sell items of all kinds', href: '/?category=products', color: 'bg-blue-100 text-blue-600' },
  { icon: Wrench,      label: 'Services', desc: 'Hire skilled professionals',   href: '/?category=services', color: 'bg-violet-100 text-violet-600' },
  { icon: HomeIcon,    label: 'Rentals',  desc: 'Homes, rooms & spaces',        href: '/?category=rentals',  color: 'bg-emerald-100 text-emerald-600' },
  { icon: Briefcase,   label: 'Business', desc: 'Promote your brand',           href: '/?category=business', color: 'bg-orange-100 text-orange-600' },
];

const stats = [
  { icon: BarChart2, value: '10,000+', label: 'Active Listings' },
  { icon: Users,     value: '50,000+', label: 'Registered Users' },
  { icon: TrendingUp,value: '120+',    label: 'Cities Covered' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="container mx-auto max-w-3xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <Zap className="w-3.5 h-3.5" />
            Africa's fastest growing marketplace
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 leading-tight">
            Your Digital Marketplace & Ad Hub
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto leading-relaxed">
            Buy, sell, hire, rent, and promote — all in one place. Connecting people and opportunities across Africa and beyond.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/">
              <Button variant="secondary" size="lg" className="gap-2 font-semibold">
                Explore Listings <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/post">
              <Button size="lg" className="gap-2 bg-primary-foreground/10 border border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground font-semibold">
                Post a Free Ad
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold text-primary">{value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
            <p className="text-muted-foreground">Find exactly what you need, or reach the right audience</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map(({ icon: Icon, label, desc, href, color }) => (
              <Link key={label} to={href}
                className="group flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why FimiHub */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Why FimiHub?</h2>
            <p className="text-muted-foreground">Built for speed, simplicity, and real connections</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Zap,       title: 'Fast & Simple',  desc: 'Post your ad in minutes with no complicated forms or approval delays.' },
              { icon: TrendingUp,title: 'Wide Reach',     desc: 'Connect with buyers, renters, and clients across multiple cities and countries.' },
              { icon: Shield,    title: 'Safe & Trusted', desc: 'Verified listings and user profiles for a transparent, trustworthy experience.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="opacity-80 mb-7">Post your first ad for free and reach thousands of potential customers today.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="gap-2 font-semibold">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" className="bg-primary-foreground/10 border border-primary-foreground/30 hover:bg-primary-foreground/20 text-primary-foreground">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">F</span>
            </div>
            <span className="font-bold">FimiHub</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 FimiHub. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {['About', 'Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
