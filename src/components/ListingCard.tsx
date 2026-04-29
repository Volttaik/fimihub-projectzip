import { Link } from 'react-router-dom';
import { MapPin, Eye, Star, ShoppingBag, Wrench, Home, Briefcase } from 'lucide-react';
import type { Listing } from '@/data/mockListings';

function formatPrice(listing: Listing) {
  if (listing.priceType === 'free') return 'Free';
  if (listing.price === null) return 'Contact for price';
  const p = `$${listing.price.toLocaleString()}`;
  if (listing.priceType === 'per_month') return `${p}/mo`;
  if (listing.priceType === 'per_hour') return `${p}/hr`;
  if (listing.priceType === 'negotiable') return `${p} · neg.`;
  return p;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
  products:  { label: 'Product',  icon: <ShoppingBag className="w-3 h-3" />, colorClass: 'bg-blue-100 text-blue-700' },
  services:  { label: 'Service',  icon: <Wrench className="w-3 h-3" />,      colorClass: 'bg-violet-100 text-violet-700' },
  rentals:   { label: 'Rental',   icon: <Home className="w-3 h-3" />,        colorClass: 'bg-emerald-100 text-emerald-700' },
  business:  { label: 'Business', icon: <Briefcase className="w-3 h-3" />,   colorClass: 'bg-orange-100 text-orange-700' },
};

interface Props {
  listing: Listing;
  compact?: boolean;
}

export default function ListingCard({ listing, compact }: Props) {
  const cat = categoryConfig[listing.category];

  return (
    <Link to={`/listing/${listing.id}`} className="group block h-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image */}
        <div className={`relative overflow-hidden bg-muted ${compact ? 'h-40' : 'h-48'}`}>
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {listing.featured && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-current" /> Featured
            </div>
          )}
          <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cat.colorClass}`}>
            {cat.icon} {cat.label}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {listing.title}
          </h3>
          {!compact && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
              {listing.description}
            </p>
          )}
          <div className="mt-auto pt-2">
            <div className="text-base font-bold text-primary mb-2">{formatPrice(listing)}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[120px]">{listing.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{listing.views}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
