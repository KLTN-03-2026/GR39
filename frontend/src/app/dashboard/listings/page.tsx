'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { Listing, CONDITION_LABELS } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate, getImageUrl } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  DRAFT: { label: 'Bản nháp', variant: 'secondary' },
  ACTIVE: { label: 'Đang rao', variant: 'success' },
  RESERVED: { label: 'Đặt cọc', variant: 'warning' },
  SOLD: { label: 'Đã bán', variant: 'default' },
  REMOVED: { label: 'Đã xóa', variant: 'destructive' },
};

export default function DashboardListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Listing[]>('/listings/my')
      .then((r) => setListings(r.data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa tin này?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 font-headline">Tin đăng của tôi</h1>
        <Button asChild>
          <Link href="/listings/create">
            <Plus className="h-4 w-4" /> Đăng tin mới
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-purple-200 py-16 text-center">
          <p className="text-slate-500">Bạn chưa có tin đăng nào</p>
          <Button className="mt-4" asChild>
            <Link href="/listings/create">Đăng tin ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const status = STATUS_LABELS[listing.status] ?? STATUS_LABELS.DRAFT;
            const cover = listing.images?.[0];
            return (
              <div key={listing.id} className="flex items-center gap-4 rounded-2xl border border-purple-50 bg-white p-4 shadow-sm">
                {/* Thumbnail */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {cover ? (
                    <img src={getImageUrl(cover.url)} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{listing.title}</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(listing.askingPrice)}</p>
                  <p className="text-xs text-slate-400">{formatDate(listing.createdAt)} · {CONDITION_LABELS[listing.condition]}</p>
                </div>

                <Badge variant={status.variant}>{status.label}</Badge>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/listings/${listing.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(listing.id)}
                    disabled={deletingId === listing.id}
                  >
                    {deletingId === listing.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
