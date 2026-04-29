import { useParams, Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ArrowLeft, MapPin, Eye, Phone, Mail, Share2, Heart, Flag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ListingCard from '@/components/ListingCard';
import { MOCK_LISTINGS, CATEGORIES } from '@/data/mockListings';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  products: 'bg-blue-50 text-blue-700',
  services: 'bg-purple-50 text-purple-700',
  rentals: 'bg-green-50 text-green-700',
  business: 'bg-orange-50 text-orange-700',
};

function formatPrice(listing: typeof MOCK_LISTINGS[0]) {
  if (listing.priceType === 'free') return 'Free';
  if (listing.price === null) return 'Contact for price';
  const p = `$${listing.price.toLocaleString()}`;
  if (listing.priceType === 'per_month') return `${p} / month`;
  if (listing.priceType === 'per_hour') return `${p} / hour`;
  if (listing.priceType === 'negotiable') return `${p} (Negotiable)`;
  return p;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = MOCK_LISTINGS.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h1 className="text-xl font-bold mb-2">Listing not found</h1>
        <p className="text-muted-foreground text-sm mb-5">This listing may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Browse Listings</Button>
      </div>
    );
  }

  const similar = MOCK_LISTINGS.filter(l => l.category === listing.category && l.id !== listing.id).slice(0, 4);
  const catLabel = CATEGORIES.find(c => c.id === listing.category)?.label;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-muted aspect-video">
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleShare} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[listing.category]}`}>{catLabel}</span>
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</div>
              <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views} views</div>
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Posted {new Date(listing.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Price</p>
            <p className="text-3xl font-bold">{formatPrice(listing)}</p>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map(tag => (
                  <Link key={tag} to={`/browse?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-accent">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="w-3 h-3" /> Report this listing
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact Card */}
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {listing.postedBy.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{listing.postedBy}</p>
                <p className="text-xs text-muted-foreground">Seller / Provider</p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`tel:${listing.contactPhone}`}
                className="flex items-center gap-3 w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" />
                <span>{listing.contactPhone}</span>
              </a>
              <a
                href={`mailto:${listing.contactEmail}`}
                className="flex items-center gap-3 w-full border border-border rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate">{listing.contactEmail}</span>
              </a>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Mention FimiHub when contacting
            </p>
          </div>

          {/* Safety tips */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">🛡️ Safety Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Meet in a public place for item exchanges</li>
              <li>• Don't pay in advance without verification</li>
              <li>• Verify identity before sharing personal info</li>
              <li>• Report suspicious listings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar listings */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-5">Similar Listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map(l => <ListingCard key={l.id} listing={l} compact />)}
          </div>
        </div>
      )}
    </div>
  );
}
