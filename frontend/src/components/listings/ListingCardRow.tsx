'use client';
import Link from 'next/link';
import { MapPin, Heart, Camera } from 'lucide-react';
import { Listing } from '@/types/api.types';
import { formatPrice, getImageUrl } from '@/lib/utils';

const CONDITION_BADGE: Record<string, { label: string; cls: string }> = {
  NEW:      { label: 'Mới 100%',  cls: 'bg-primary text-white' },
  LIKE_NEW: { label: 'Như mới',   cls: 'bg-green-500 text-white' },
  GOOD:     { label: 'Tốt',       cls: 'bg-slate-500 text-white' },
  FAIR:     { label: 'Khá',       cls: 'bg-amber-500 text-white' },
  POOR:     { label: 'Kém',       cls: 'bg-red-500 text-white' },
};

interface Props {
  listing: Listing;
}

export function ListingCardRow({ listing }: Props) {
  const cover = listing.images?.[0];
  const badge = CONDITION_BADGE[listing.condition] ?? CONDITION_BADGE.GOOD;

  return (
    <Link href={`/listings/${listing.id}`}>
      <article className="flex gap-4 bg-white rounded-2xl border border-purple-50 shadow-sm hover:shadow-md transition-all p-4 group cursor-pointer">
        {/* ── Ảnh ── */}
        <div className="relative w-40 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-50">
          {cover ? (
            <img
              src={getImageUrl(cover.url)}
              alt={listing.title}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <span className="material-symbols-outlined text-5xl">smartphone</span>
            </div>
          )}
          {/* Condition badge */}
          <span className={`absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          {/* Photo count */}
          {listing.images?.length > 1 && (
            <span className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              <Camera className="h-2.5 w-2.5" />
              {listing.images.length}
            </span>
          )}
        </div>

        {/* ── Nội dung ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {listing.title}
          </h3>

          {/* Tags: model, storage, warranty */}
          <div className="flex flex-wrap gap-1.5">
            {listing.model && (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {listing.model}
              </span>
            )}
            {listing.storage && (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {listing.storage}
              </span>
            )}
            {listing.warranty && (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {listing.warranty}
              </span>
            )}
          </div>

          {/* Price */}
          <p className="text-lg font-black text-primary">
            {formatPrice(listing.askingPrice)}
          </p>

          {/* Extra chips */}
          <div className="flex flex-wrap gap-1.5">
            {listing.origin && (
              <span className="text-[10px] font-semibold border border-green-200 text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                {listing.origin}
              </span>
            )}
            {listing.color && (
              <span className="text-[10px] font-semibold border border-slate-200 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                {listing.color}
              </span>
            )}
          </div>

          {/* Location */}
          {listing.location && (
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-[11px] truncate">{listing.location.split(',').slice(-2).join(',').trim()}</span>
            </div>
          )}

          {/* Seller + Heart */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex items-center gap-2">
              {listing.seller?.avatar ? (
                <img src={getImageUrl(listing.seller.avatar)} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">
                  {listing.seller?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[120px]">
                {listing.seller?.name}
              </span>
            </div>
            <button
              onClick={(e) => e.preventDefault()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
