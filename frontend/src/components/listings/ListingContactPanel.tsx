'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Listing } from '@/types/api.types';
import { getImageUrl, formatDate } from '@/lib/utils';
import { BuyNowButton } from './BuyNowButton';

const SUGGESTIONS = [
  'Điện thoại này còn không?',
  'Bạn có ship hàng không?',
  'Sản phẩm còn bảo hành không?',
  'Giá có thương lượng không?',
];

interface Props {
  listing: Listing;
}

export function ListingContactPanel({ listing }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isSelf = user?.id === listing.seller.id;

  const handleContact = async (msg?: string) => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    setLoading(true);
    try {
      const res = await api.post<{ id: string }>('/conversations', { listingId: listing.id });
      if (msg?.trim()) {
        await api.post(`/conversations/${res.data.id}/messages`, { content: msg.trim() });
      }
      router.push(`/dashboard/messages?conversationId=${res.data.id}`);
    } catch (err: unknown) {
      const id = (err as { response?: { data?: { conversationId?: string } } })?.response?.data?.conversationId;
      if (id) router.push(`/dashboard/messages?conversationId=${id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Phone + Chat / BuyNow buttons */}
      {!isSelf && (
        <div className="grid grid-cols-2 gap-3">
          {listing.seller.phone ? (
            <a
              href={`tel:${listing.seller.phone}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              {listing.seller.phone}
            </a>
          ) : (
            <BuyNowButton
              listingId={listing.id}
              sellerId={listing.seller.id}
              listingStatus={listing.status}
            />
          )}
          <button
            onClick={() => handleContact()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 py-3 text-sm font-bold text-gray-900 transition-colors disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
        </div>
      )}

      {/* Seller card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <Link href={`/users/${listing.seller.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {listing.seller.avatar ? (
              <img
                src={getImageUrl(listing.seller.avatar)}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                alt={listing.seller.name}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold ring-2 ring-gray-100">
                {listing.seller.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{listing.seller.name}</p>
              {listing.seller.createdAt && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  Tham gia {formatDate(listing.seller.createdAt)}
                </p>
              )}
            </div>
          </Link>
          <Link
            href={`/users/${listing.seller.id}`}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"
          >
            Xem trang
          </Link>
        </div>
      </div>

      {/* Quick message input */}
      {!isSelf && (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhắn hỏi mua hàng..."
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) handleContact(message); }}
            />
            <button
              onClick={() => handleContact(message)}
              disabled={!message.trim() || loading}
              className="h-9 w-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-xs font-bold text-gray-900 transition-colors disabled:opacity-40"
            >
              Gửi
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleContact(s)}
                className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
