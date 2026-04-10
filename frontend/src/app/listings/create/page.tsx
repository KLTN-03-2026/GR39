'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AiPricingResult } from '@/components/listings/AiPricingResult';
import { Listing, Category } from '@/types/api.types';

const schema = z.object({
  title: z.string().min(10, 'Tiêu đề ít nhất 10 ký tự'),
  description: z.string().min(20, 'Mô tả ít nhất 20 ký tự'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  askingPrice: z.number().min(100000, 'Giá tối thiểu 100,000đ'),
  brand: z.string().min(1, 'Vui lòng chọn thương hiệu'),
  model: z.string().min(1, 'Vui lòng nhập model'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  storage: z.string().optional(),
  color: z.string().optional(),
  origin: z.string().optional(),
  warranty: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AiPricingData {
  pMarket: number;
  pFinal: number;
  priceRange: { low: number; high: number };
  damageBreakdown: { part: string; severity: number; description: string; weight: number; deductionPercent: number }[];
  confidenceScore: number;
  detectedModel: string;
  overallCondition: string;
  summary: string;
  marketSummary: string;
  dataPoints: number;
}

const CONDITIONS = [
  { value: 'NEW', label: 'Mới 100%' },
  { value: 'LIKE_NEW', label: 'Như mới (99%)' },
  { value: 'GOOD', label: 'Tốt (90-98%)' },
  { value: 'FAIR', label: 'Khá (70-89%)' },
  { value: 'POOR', label: 'Kém (<70%)' },
] as const;

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme', 'OnePlus', 'Nokia', 'Huawei', 'Sony', 'Motorola', 'ASUS', 'LG', 'BKAV'];

const STORAGE_OPTIONS = ['< 8GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '> 2 TB'];

const COLOR_OPTIONS = ['Bạc', 'Đen', 'Đen bóng - Jet black', 'Đỏ', 'Hồng', 'Trắng', 'Vàng', 'Vàng hồng', 'Xám', 'Xanh dương', 'Xanh lá', 'Tím', 'Cam', 'Màu khác'];

const ORIGIN_OPTIONS = ['Việt Nam', 'Ấn Độ', 'Hàn Quốc', 'Thái Lan', 'Nhật Bản', 'Trung Quốc', 'Mỹ', 'Đức', 'Đài Loan', 'Nước khác'];

const WARRANTY_OPTIONS = ['Hết bảo hành', '1 tháng', '2 tháng', '3 tháng', '4-6 tháng', '7-12 tháng', '>12 tháng', 'Còn bảo hành'];

export default function CreateListingPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiResult, setAiResult] = useState<AiPricingData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    api.get<Category[]>('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'GOOD' },
  });

  const watchedBrand = watch('brand');
  const watchedModel = watch('model');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
    // Reset AI result khi ảnh thay đổi
    setAiResult(null);
    setAiError('');
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
    setAiResult(null);
  };

  const handleAiPricing = async () => {
    if (images.length === 0) {
      setAiError('Vui lòng tải lên ít nhất 1 ảnh để phân tích');
      return;
    }
    if (!watchedBrand || !watchedModel) {
      setAiError('Vui lòng điền Thương hiệu và Model trước khi định giá');
      return;
    }

    setIsAnalyzing(true);
    setAiError('');
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append('brand', watchedBrand);
      formData.append('model', watchedModel);
      images.forEach((img) => formData.append('images', img));

      const res = await api.post<AiPricingData>('/pricing/estimate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAiResult(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosErr?.response?.status;
      const msg = axiosErr?.response?.data?.message;
      console.error('[AI Pricing Error]', status, msg, err);
      if (status === 401) {
        setAiError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
      } else if (status === 400) {
        setAiError(`Lỗi dữ liệu: ${msg ?? 'Kiểm tra ảnh và thông tin máy.'}`);
      } else {
        setAiError(`Định giá AI thất bại (${status ?? 'network'}). Vui lòng thử lại.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseAiPrice = (price: number) => {
    setValue('askingPrice', price, { shouldValidate: true });
    // Scroll xuống ô giá
    document.getElementById('askingPrice')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, String(v));
      });
      images.forEach((img) => formData.append('images', img));

      const res = await api.post<Listing>('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Auto publish
      await api.patch(`/listings/${res.data.id}/publish`);
      router.push(`/listings/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Có lỗi xảy ra'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 font-headline">Đăng tin bán máy</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">
            Ảnh sản phẩm <span className="text-gray-400 font-normal text-sm">(tối đa 10 ảnh)</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative h-24 w-24">
                <img src={src} alt="" className="h-full w-full rounded-lg object-cover border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 10 && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-200 text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <Upload className="h-6 w-6" />
                <span className="mt-1 text-xs">Thêm ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 font-headline">Thông tin cơ bản</h2>

          <div>
            <Label htmlFor="title">Tiêu đề tin đăng</Label>
            <Input id="title" className="mt-1" placeholder="VD: iPhone 14 Pro Max 256GB Tím Nguyên Seal" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Thương hiệu</Label>
              <select id="brand" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('brand')}>
                <option value="">Chọn hãng</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
            </div>
            <div>
              <Label htmlFor="model">Model máy</Label>
              <Input id="model" className="mt-1" placeholder="VD: iPhone 14 Pro Max" {...register('model')} />
              {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage">Dung lượng</Label>
              <select id="storage" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('storage')}>
                <option value="">Chọn dung lượng</option>
                {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="color">Màu sắc</Label>
              <select id="color" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('color')}>
                <option value="">Chọn màu sắc</option>
                {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Xuất xứ</Label>
              <select id="origin" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('origin')}>
                <option value="">Chọn xuất xứ</option>
                {ORIGIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="warranty">Bảo hành</Label>
              <select id="warranty" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('warranty')}>
                <option value="">Chọn bảo hành</option>
                {WARRANTY_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="categoryId">Danh mục</Label>
            <select id="categoryId" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" {...register('categoryId')}>
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.children && cat.children.length > 0
                    ? cat.children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))
                    : <option value={cat.id}>{cat.name}</option>
                  }
                </optgroup>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>

          <div>
            <Label>Tình trạng máy</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <label key={c.value} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={c.value} {...register('condition')} className="sr-only peer" />
                  <span className="rounded-full border border-purple-100 px-3 py-1.5 text-xs font-bold cursor-pointer peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white hover:border-primary/40 transition-colors">
                    {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Pricing Section */}
          <div className="border-t border-dashed border-purple-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="askingPrice">Giá bán (VND)</Label>
                <p className="text-xs text-slate-400 mt-0.5">Dùng AI để gợi ý giá khách quan</p>
              </div>
              <button
                type="button"
                onClick={handleAiPricing}
                disabled={isAnalyzing}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Đang phân tích...' : 'Định giá bằng AI'}
              </button>
            </div>

            <Input
              id="askingPrice"
              type="number"
              placeholder="VD: 25000000"
              {...register('askingPrice', { valueAsNumber: true })}
            />
            {errors.askingPrice && <p className="mt-1 text-xs text-red-600">{errors.askingPrice.message}</p>}

            {aiError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {aiError}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <textarea
              id="description"
              rows={5}
              className="mt-1 w-full rounded-xl border border-purple-100 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Mô tả tình trạng máy, phụ kiện kèm theo, lý do bán..."
              {...register('description')}
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>
        </div>

        {/* AI Pricing Result */}
        {aiResult && (
          <AiPricingResult data={aiResult} onUsePrice={handleUseAiPrice} />
        )}

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Đăng tin ngay
        </Button>
      </form>
    </div>
  );
}
