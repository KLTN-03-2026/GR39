'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smartphone, Loader2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl border border-red-100 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Link không hợp lệ</h1>
          <p className="mt-2 text-sm text-slate-500">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link href="/forgot-password">Yêu cầu link mới</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl border border-purple-100 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Đặt lại mật khẩu thành công!</h1>
          <p className="mt-3 text-sm text-slate-500">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/login')}>
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-headline">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                className="pl-10"
                {...register('newPassword')}
              />
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                className="pl-10"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Đặt lại mật khẩu
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
