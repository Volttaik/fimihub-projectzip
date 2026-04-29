import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, ShoppingBag, Wrench, Home, Briefcase, TrendingUp, Search, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '@/components/PostCard';
import { MOCK_LISTINGS, type Category } from '@/data/mockListings';

const CATEGORIES = [
  { id: 'products' as Category, label: 'Products', icon: ShoppingBag },
  { id: 'services' as Category, label: 'Services', icon: Wrench },
  { id: 'rentals'  as Category, label: 'Rentals',  icon: Home },
  { id: 'business' as Category, label: 'Business', icon: Briefcase },
];

const TRENDING = ['MacBook', 'iPhone 15', 'Lagos Apartment', 'Web Design', 'Gym', 'Sony Camera'];

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Latest first' },
  { value: 'popular',    label: 'Most viewed' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
];

const CONDITION_OPTIONS = ['Any', 'New', 'Used', 'Refurbished'];
const RATE_TYPE_OPTIONS  = ['Any', 'Fixed price', 'Per hour', 'Free'];
const BEDROOM_OPTIONS    = ['Any', '1', '2', '3', '4+'];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort,      setSort]      = useState('recent');
  const [priceMin,  setPriceMin]  = useState('');
  const [priceMax,  setPriceMax]  = useState('');
  const [condition, setCondition] = useState('Any');
  const [rateType,  setRateType]  = useState('Any');
  const [bedrooms,  setBedrooms]  = useState('Any');
  const [showFilters, setShowFilters] = useState(false);

  const query    = searchParams.get('q') || '';
  const category = searchParams.get('category') as Category | null;
  const featured = searchParams.get('featured') === 'true';

  const setCategory = (cat: Category | null) => {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set('category', cat); else next.delete('category');
    setSearchParams(next);
    // reset spec filters on category change
    setCondition('Any'); setRateType('Any'); setBedrooms('Any');
    setPriceMin(''); setPriceMax('');
  };

  const filtered = useMemo(() => {
    let list = [...MOCK_LISTINGS];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        l.location.toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter(l => l.category === category);
    if (featured)  list = list.filter(l => l.featured);
    if (priceMin)  list = list.filter(l => l.price !== null && l.price >= Number(priceMin));
    if (priceMax)  list = list.filter(l => l.price !== null && l.price <= Number(priceMax));
    if (category === 'services' && rateType !== 'Any') {
      const map: Record<string, string> = { 'Fixed price': 'fixed', 'Per hour': 'per_hour', 'Free': 'free' };
      list = list.filter(l => l.priceType === map[rateType]);
    }
    if (sort === 'price_asc')   list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === 'popular')    list.sort((a, b) => b.views - a.views);
    else list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    return list;
  }, [query, category, featured, priceMin, priceMax, rateType, sort]);

  const activeFilterCount = [
    priceMin, priceMax,
    condition !== 'Any' ? condition : '',
    rateType  !== 'Any' ? rateType  : '',
    bedrooms  !== 'Any' ? bedrooms  : '',
    featured  ? 'featured' : '',
  ].filter(Boolean).length;

  const clearAll = () => {
    setPriceMin(''); setPriceMax('');
    setCondition('Any'); setRateType('Any'); setBedrooms('Any');
    const n = new URLSearchParams(searchParams);
    n.delete('featured'); setSearchParams(n);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex gap-6 items-start">

        {/* ── MAIN FEED ── */}
        <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">

          {/* Category tabs */}
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 mb-3 shadow-sm flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategory(null)}
              className={`text-sm px-4 py-1.5 rounded-xl font-medium transition-all duration-200 ${!category ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-xl font-medium transition-all duration-200 ${category === cat.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-xs border border-border/70 rounded-xl px-3 py-1.5 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer transition-all"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 ${showFilters ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${showFilters ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Smart filter panel */}
          {showFilters && (
            <div className="bg-card/85 backdrop-blur-md border border-border/50 rounded-2xl p-4 mb-3 shadow-sm space-y-4">

              {/* Price range — always shown */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  {category === 'rentals' ? 'Monthly Budget' : 'Price Range'} ($)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    className="w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  <span className="text-muted-foreground text-sm shrink-0">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    className="w-full text-sm border border-border/70 rounded-xl px-3 py-2 bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              {/* Products specialisation */}
              {(category === 'products' || !category) && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">Condition</label>
                  <div className="flex gap-2 flex-wrap">
                    {CONDITION_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCondition(opt)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${condition === opt ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services specialisation */}
              {(category === 'services' || !category) && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">Rate Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {RATE_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setRateType(opt)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${rateType === opt ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rentals specialisation */}
              {(category === 'rentals' || !category) && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block">Bedrooms</label>
                  <div className="flex gap-2">
                    {BEDROOM_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setBedrooms(opt)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${bedrooms === opt ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div>
                  <p className="text-xs font-semibold text-foreground">Featured only</p>
                  <p className="text-xs text-muted-foreground">Show sponsored & promoted ads</p>
                </div>
                <button
                  onClick={() => { const n = new URLSearchParams(searchParams); if (featured) n.delete('featured'); else n.set('featured', 'true'); setSearchParams(n); }}
                  className={`w-10 h-5 rounded-full transition-all duration-300 relative ${featured ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${featured ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active query badge */}
          {query && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-card/80 border border-border/50 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Results for</span>
                <span className="font-semibold">"{query}"</span>
                <button onClick={() => { const n = new URLSearchParams(searchParams); n.delete('q'); setSearchParams(n); }} className="text-muted-foreground hover:text-foreground ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {/* Count */}
          <p className="text-xs text-muted-foreground mb-3 px-0.5">
            <span className="font-semibold text-foreground">{filtered.length}</span> listings
          </p>

          {/* Feed */}
          {filtered.length === 0 ? (
            <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl text-center py-20 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold">Nothing here yet</p>
              <p className="text-sm text-muted-foreground mt-1">Try different filters or search terms.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(l => <PostCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24">

          {/* Post CTA */}
          <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Ready to sell?</span>
            </div>
            <p className="text-xs opacity-75 mb-4 leading-relaxed">Post your ad free and reach thousands of buyers today.</p>
            <Link to="/post">
              <Button variant="secondary" size="sm" className="w-full font-semibold shadow-sm">Post a Free Ad</Button>
            </Link>
          </div>

          {/* Trending */}
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Trending Now</span>
            </div>
            <div className="flex flex-col">
              {TRENDING.map((term, i) => (
                <button
                  key={term}
                  onClick={() => { const n = new URLSearchParams(searchParams); n.set('q', term); setSearchParams(n); }}
                  className="flex items-center gap-3 text-left py-2 px-2 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
                >
                  <span className="text-xs font-bold text-muted-foreground w-4 group-hover:text-primary transition-colors">{i + 1}</span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors duration-200">{term}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm">
            <span className="font-semibold text-sm block mb-3">Categories</span>
            <div className="flex flex-col gap-0.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const count = MOCK_LISTINGS.filter(l => l.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all duration-200 text-left ${category === cat.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm flex-1">{cat.label}</span>
                    <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
