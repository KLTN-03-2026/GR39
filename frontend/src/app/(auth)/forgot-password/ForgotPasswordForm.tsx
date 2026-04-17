'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smartphone, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
});
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.post('/auth/forgot-password', data);
    setSentEmail(data.email);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl border border-purple-100 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Kiểm tra email của bạn</h1>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến
          </p>
          <p className="mt-1 font-semibold text-primary">{sentEmail}</p>
          <p className="mt-3 text-xs text-slate-400">
            Link có hiệu lực trong 1 giờ. Kiểm tra mục Spam nếu không thấy email.
          </p>
          <Button
            className="mt-6 w-full"
            variant="outline"
            onClick={() => setSent(false)}
          >
            Gửi lại email
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-headline">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-500">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Gửi hướng dẫn đặt lại mật khẩu
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
