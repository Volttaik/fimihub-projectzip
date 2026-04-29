import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ShoppingBag, Wrench, Home, Briefcase, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ListingCard from '@/components/ListingCard';
import { MOCK_LISTINGS, type Category } from '@/data/mockListings';

const CATEGORIES = [
  { id: 'products' as Category, label: 'Products',          icon: ShoppingBag },
  { id: 'services' as Category, label: 'Services & Skills', icon: Wrench },
  { id: 'rentals'  as Category, label: 'Rentals',           icon: Home },
  { id: 'business' as Category, label: 'Business & Brands', icon: Briefcase },
];

const SORT_OPTIONS = [
  { value: 'recent',     label: 'Most Recent' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',    label: 'Most Viewed' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('recent');

  const query    = searchParams.get('q') || '';
  const category = searchParams.get('category') as Category | null;
  const featuredOnly = searchParams.get('featured') === 'true';

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

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
    if (featuredOnly) list = list.filter(l => l.featured);
    if (priceMin) list = list.filter(l => l.price !== null && l.price >= Number(priceMin));
    if (priceMax) list = list.filter(l => l.price !== null && l.price <= Number(priceMax));
    if (sort === 'price_asc')  list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === 'popular')    list.sort((a, b) => b.views - a.views);
    else list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    return list;
  }, [query, category, featuredOnly, priceMin, priceMax, sort]);

  const setCategory = (cat: Category | null) => {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set('category', cat); else next.delete('category');
    setSearchParams(next);
  };

  const clearQuery = () => { const n = new URLSearchParams(searchParams); n.delete('q'); setSearchParams(n); };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {category ? CATEGORIES.find(c => c.id === category)?.label : query ? `Results for "${query}"` : 'All Listings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} listings found</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {query && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={clearQuery}>"{query}" <X className="w-3 h-3" /></Badge>}
        {category && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCategory(null)}>{CATEGORIES.find(c => c.id === category)?.label} <X className="w-3 h-3" /></Badge>}
        {featuredOnly && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => { const n = new URLSearchParams(searchParams); n.delete('featured'); setSearchParams(n); }}>Featured only <X className="w-3 h-3" /></Badge>}
      </div>

      <div className="flex gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-56 shrink-0`}>
          <div className="bg-card border border-border rounded-xl p-4 sticky top-24">
            <h3 className="font-semibold text-sm mb-3">Category</h3>
            <div className="flex flex-col gap-1 mb-5">
              <button onClick={() => setCategory(null)} className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${!category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                All Categories
              </button>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${category === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                    <Icon className="w-4 h-4" /> {cat.label}
                  </button>
                );
              })}
            </div>
            <h3 className="font-semibold text-sm mb-3">Price Range</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-2 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            {(priceMin || priceMax) && (
              <button className="text-xs text-muted-foreground mt-2 hover:text-foreground" onClick={() => { setPriceMin(''); setPriceMax(''); }}>Clear price filter</button>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
