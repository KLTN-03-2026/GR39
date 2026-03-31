'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { ListingCard } from '@/components/listings/ListingCard';
import { Listing, PaginatedResponse, DeviceCondition } from '@/types/api.types';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme'];
const CATEGORIES = ['Tất cả', 'Khuyến mãi', 'iPhone', 'Samsung', 'Xiaomi', 'Phụ kiện'];
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc',label: 'Giá cao → thấp' },
];

export function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const search    = searchParams.get('search') ?? '';
  const brand     = searchParams.get('brand') ?? '';
  const condition = (searchParams.get('condition') ?? '') as DeviceCondition | '';
  const sort      = searchParams.get('sort') ?? 'newest';
  const page      = Number(searchParams.get('page') ?? '1');

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    router.push(`/listings?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (search)    p.set('search', search);
        if (brand)     p.set('brand', brand);
        if (condition) p.set('condition', condition);
        p.set('sort', sort); p.set('page', String(page)); p.set('limit', '9');
        const res = await api.get<PaginatedResponse<Listing>>(`/listings?${p.toString()}`);
        setListings(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch { setListings([]); }
      finally { setLoading(false); }
    })();
  }, [search, brand, condition, sort, page]);

  return (
    <div className="flex min-h-screen pt-24 px-8 pb-12 gap-8">
      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="w-72 flex-shrink-0 space-y-6 sticky top-24 h-fit">

        {/* Price Range */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm font-headline">Khoảng giá</h3>
            <button className="text-xs text-primary font-bold">Xóa</button>
          </div>
          <div className="h-1 bg-slate-100 rounded-full relative my-4">
            <div className="absolute left-[20%] right-[20%] h-full bg-primary rounded-full" />
            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
            <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold">5.000.000₫</span>
            <span className="text-xs font-bold">35.000.000₫</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Giá trung bình thị trường ~18.000.000₫</p>
        </div>

        {/* Sort */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
          <h3 className="font-bold text-sm font-headline mb-3">Sắp xếp</h3>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateParams({ sort: o.value })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  sort === o.value ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm font-headline">Thương hiệu</h3>
            {brand && (
              <button className="text-xs text-primary font-bold" onClick={() => updateParams({ brand: '' })}>
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-3">
            {BRANDS.map((b) => (
              <label key={b} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium group-hover:text-primary transition-colors">{b}</span>
                </div>
                <input
                  type="checkbox"
                  checked={brand === b}
                  onChange={() => updateParams({ brand: brand === b ? '' : b })}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm font-headline">Tình trạng</h3>
            {condition && (
              <button className="text-xs text-primary font-bold" onClick={() => updateParams({ condition: '' })}>
                Xóa
              </button>
            )}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl flex-col gap-1">
            {(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as DeviceCondition[]).map((c) => {
              const labels: Record<string, string> = { NEW: 'Mới', LIKE_NEW: 'Như mới', GOOD: 'Tốt', FAIR: 'Khá' };
              return (
                <button
                  key={c}
                  onClick={() => updateParams({ condition: condition === c ? '' : c })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left ${
                    condition === c ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  {labels[c]}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 min-w-0">
        {/* Category Tabs */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-600 border border-purple-50 hover:bg-primary-light hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="mb-4 text-sm text-slate-500 font-medium">
          {loading ? 'Đang tải...' : `${total} kết quả`}
          {(brand || condition || search) && (
            <button
              onClick={() => { updateParams({ brand: '', condition: '', search: '' }); }}
              className="ml-3 text-xs text-primary hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </p>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-[2rem] bg-white/60" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                featured={i === 3} // Card thứ 4 dùng featured dark style
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-purple-50 py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200">search_off</span>
            <p className="mt-3 text-slate-500">Không tìm thấy kết quả phù hợp</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(p));
                  router.push(`/listings?${params.toString()}`);
                }}
                className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${
                  p === page
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white border border-purple-100 text-slate-600 hover:border-primary hover:text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
