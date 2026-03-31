import Link from 'next/link';
import { api } from '@/lib/axios';
import { ListingCard } from '@/components/listings/ListingCard';
import { PaginatedResponse, Listing } from '@/types/api.types';

async function getLatestListings(): Promise<Listing[]> {
  try {
    const res = await api.get<PaginatedResponse<Listing>>('/listings?limit=6&sort=newest');
    return res.data.data;
  } catch { return []; }
}

export default async function HomePage() {
  const listings = await getLatestListings();

  return (
    <div className="pt-24 px-8 pb-12">
      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden bg-[#1E1B4B] rounded-[2rem] p-10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-block bg-primary text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full mb-4 tracking-wide">
            AI-Powered Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white font-headline leading-tight">
            Mua bán điện thoại<br />
            <span className="text-purple-300">định giá bằng AI</span>
          </h1>
          <p className="mt-4 text-white/60 text-base leading-relaxed">
            Nền tảng giao dịch minh bạch với công nghệ AI phân tích ảnh và thị trường thực tế.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/listings"
              className="px-7 py-3.5 bg-primary text-white font-bold rounded-full hover:bg-purple-600 transition-colors shadow-lg shadow-primary/30 text-sm"
            >
              Xem điện thoại
            </Link>
            <Link
              href="/listings/create"
              className="px-7 py-3.5 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/20 text-sm"
            >
              Đăng bán ngay
            </Link>
          </div>
        </div>
        {/* Stats */}
        <div className="relative z-10 flex flex-col gap-4">
          {[
            { icon: 'smartphone', label: 'Tin đăng', value: '1.200+' },
            { icon: 'verified',   label: 'Giao dịch thành công', value: '850+' },
            { icon: 'psychology', label: 'Định giá AI chính xác', value: '95%' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-3 border border-white/10">
              <span className="material-symbols-outlined text-purple-300 text-2xl">{s.icon}</span>
              <div>
                <p className="text-xl font-black text-white font-headline">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: 'psychology',  title: 'Định giá AI tự động',   desc: 'Gemini Vision phân tích ảnh thực tế + dữ liệu thị trường để đề xuất giá chính xác', color: 'bg-purple-100 text-primary' },
          { icon: 'shield',      title: 'Thanh toán Escrow',      desc: 'VNPAY giữ tiền an toàn cho đến khi bạn xác nhận nhận được máy', color: 'bg-green-100 text-green-700' },
          { icon: 'chat_bubble', title: 'Chat trực tiếp',         desc: 'Nhắn tin real-time với người bán, thương lượng nhanh chóng', color: 'bg-blue-100 text-blue-700' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-[2rem] p-6 border border-purple-50 shadow-sm">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${f.color}`}>
              <span className="material-symbols-outlined text-2xl">{f.icon}</span>
            </div>
            <h3 className="font-bold text-base font-headline">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Latest Listings ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold font-headline">Tin đăng mới nhất</h2>
          <Link href="/listings" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            Xem tất cả
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} featured={i === 3} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-purple-50 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200">inventory_2</span>
            <p className="mt-3 text-slate-500">Chưa có tin đăng nào. Hãy là người đầu tiên!</p>
            <Link
              href="/listings/create"
              className="inline-block mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-full text-sm hover:bg-purple-700 transition-colors"
            >
              Đăng tin ngay
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
