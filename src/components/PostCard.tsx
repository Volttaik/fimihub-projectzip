import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Heart, MessageCircle, Share2, Star, ShoppingBag, Wrench, Home, Briefcase, BadgeCheck } from 'lucide-react';
import type { Listing } from '@/data/mockListings';
import { toast } from 'sonner';

function formatPrice(listing: Listing) {
  if (listing.priceType === 'free') return 'Free';
  if (listing.price === null) return 'Contact for price';
  const p = `$${listing.price.toLocaleString()}`;
  if (listing.priceType === 'per_month') return `${p} / mo`;
  if (listing.priceType === 'per_hour') return `${p} / hr`;
  return p;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }> = {
  products: { label: 'Products', icon: ShoppingBag, badgeClass: 'bg-primary/10 text-primary' },
  services: { label: 'Services', icon: Wrench,      badgeClass: 'bg-primary/10 text-primary' },
  rentals:  { label: 'Rentals',  icon: Home,        badgeClass: 'bg-primary/10 text-primary' },
  business: { label: 'Business', icon: Briefcase,   badgeClass: 'bg-accent/15 text-accent-foreground' },
};

const avatarPalette = [
  'hsl(263,78%,56%)', 'hsl(35,90%,52%)', 'hsl(155,55%,42%)',
  'hsl(217,85%,53%)', 'hsl(340,70%,52%)', 'hsl(199,80%,46%)',
];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarPalette[Math.abs(h) % avatarPalette.length];
}

export default function PostCard({ listing }: { listing: Listing }) {
  const [saved, setSaved] = useState(false);
  const cat = categoryConfig[listing.category] ?? categoryConfig.products;
  const Icon = cat.icon;
  const avatarColor = getAvatarColor(listing.postedBy);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/listing/${listing.id}`);
    toast.success('Link copied!');
  };

  return (
    <article className="bg-card/85 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group/card">

      {/* Featured ribbon */}
      {listing.featured && (
        <div className="flex items-center gap-1.5 px-4 pt-3">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="text-xs font-semibold text-accent tracking-wide uppercase">Sponsored</span>
        </div>
      )}

      <div className="p-4 pb-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {listing.postedBy.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{listing.postedBy}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[160px]">{listing.location}</span>
                <span className="text-border">·</span>
                <span className="shrink-0">{timeAgo(listing.postedAt)}</span>
              </div>
            </div>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cat.badgeClass}`}>
            <Icon className="w-3 h-3" />
            {cat.label}
          </span>
        </div>

        {/* Content */}
        <Link to={`/listing/${listing.id}`} className="block">
          <h3 className="font-bold text-[15px] leading-snug mb-1.5 group-hover/card:text-primary transition-colors duration-200">
            {listing.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {listing.description}
          </p>

          {listing.images[0] && (
            <div className="rounded-xl overflow-hidden mb-3 bg-muted aspect-video">
              <img
                src={listing.images[0]}
                alt={listing.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
              />
            </div>
          )}
        </Link>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-base font-bold text-primary">{formatPrice(listing)}</span>
          {listing.priceType === 'negotiable' && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Negotiable</span>
          )}
          {listing.tags.slice(0, 2).map(tag => (
            <Link key={tag} to={`/?q=${encodeURIComponent(tag)}`}>
              <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full hover:bg-primary/15 transition-colors">#{tag}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center border-t border-border/60 px-1">
        <Link
          to={`/listing/${listing.id}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 px-3 py-2.5 rounded-xl hover:bg-primary/8 flex-1 justify-center"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Contact</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-2.5 flex-1 justify-center">
          <Eye className="w-4 h-4" />
          <span>{listing.views.toLocaleString()}</span>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className={`flex items-center gap-1.5 text-xs transition-all duration-200 px-3 py-2.5 rounded-xl flex-1 justify-center ${saved ? 'text-rose-500 bg-rose-50' : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-50/60'}`}
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-rose-500 scale-110' : ''}`} />
          <span className="hidden sm:inline font-medium">Save</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 px-3 py-2.5 rounded-xl hover:bg-primary/8 flex-1 justify-center"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Share</span>
        </button>
      </div>
    </article>
  );
}
