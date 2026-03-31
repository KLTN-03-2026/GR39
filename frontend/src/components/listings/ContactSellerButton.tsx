'use client';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

interface Props {
  listingId: string;
  sellerId: string;
}

export function ContactSellerButton({ listingId, sellerId }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleContact = async () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (user?.id === sellerId) return;

    setLoading(true);
    try {
      const res = await api.post<{ id: string }>('/conversations', { listingId });
      router.push(`/dashboard/messages?conversationId=${res.data.id}`);
    } catch (err: unknown) {
      const id = (err as { response?: { data?: { conversationId?: string } } })?.response?.data?.conversationId;
      if (id) router.push(`/dashboard/messages?conversationId=${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (user?.id === sellerId) return null;

  return (
    <Button className="w-full" onClick={handleContact} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Liên hệ người bán
    </Button>
  );
}
