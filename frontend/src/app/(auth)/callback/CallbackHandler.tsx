'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/axios';
import { User } from '@/types/api.types';

export function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        localStorage.setItem('accessToken', accessToken);
        const res = await api.get<User>('/users/me');
        setAuth(res.data, accessToken, refreshToken);
        router.push('/');
      } catch {
        router.push('/login');
      }
    })();
  }, [searchParams, setAuth, router]);

  return (
    <>
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-gray-600">Đang xử lý đăng nhập...</p>
    </>
  );
}
