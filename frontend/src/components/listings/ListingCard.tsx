import Link from 'next/link';
import { Listing, CONDITION_LABELS } from '@/types/api.types';
import { formatPrice, getImageUrl } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  featured?: boolean;
}

const CONDITION_BADGE: Record<string, { label: string; className: string }> = {
  NEW:      { label: 'Mới 100%',    className: 'text-primary border border-primary/10 bg-white/90' },
  LIKE_NEW: { label: 'Như mới',     className: 'text-green-600 border border-green-100 bg-white/90' },
  GOOD:     { label: 'Tốt',         className: 'text-slate-500 border border-slate-100 bg-white/90' },
  FAIR:     { label: 'Khá',         className: 'text-amber-600 border border-amber-100 bg-white/90' },
  POOR:     { label: 'Kém',         className: 'text-red-500 border border-red-100 bg-white/90' },
};

export function ListingCard({ listing, featured = false }: ListingCardProps) {
  const coverImage = listing.images?.[0];
  const badge = CONDITION_BADGE[listing.condition] ?? CONDITION_BADGE.GOOD;

  if (featured) {
    return (
      <Link href={`/listings/${listing.id}`}>
        <article className="bg-[#1E1B4B] text-white rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />

          <div className="relative aspect-square mb-4 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
            {coverImage ? (
              <img
                src={getImageUrl(coverImage.url)}
                alt={listing.title}
                className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20 text-6xl">smartphone</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className="bg-primary text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">
                TOP DEAL
              </span>
            </div>
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-sm">favorite</span>
            </button>
          </div>

          <div>
            <p className="font-bold text-sm leading-tight text-white/90 line-clamp-2">{listing.title}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-lg font-black text-white">{formatPrice(listing.askingPrice)}</span>
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white hover:scale-110 transition-all">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/listings/${listing.id}`}>
      <article className="bg-white rounded-[2rem] p-5 border border-purple-50 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
        <div className="relative aspect-square mb-4 bg-slate-50 rounded-2xl overflow-hidden">
          {coverImage ? (
            <img
              src={getImageUrl(coverImage.url)}
              alt={listing.title}
              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <span className="material-symbols-outlined text-6xl">smartphone</span>
            </div>
          )}

          {/* Condition + Top badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className={`backdrop-blur text-[9px] font-black uppercase px-2 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
            {listing.seller && (
              <span className="bg-primary text-white text-[9px] font-black uppercase px-2 py-1 rounded-full w-fit">
                {listing.brand}
              </span>
            )}
          </div>

          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-sm">favorite</span>
          </button>
        </div>

        <div>
          <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between mt-4">
            <span className="text-lg font-black">{formatPrice(listing.askingPrice)}</span>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-black group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
