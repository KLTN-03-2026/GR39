'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';

export function SaveButton({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => setSaved(!saved)}
      title={saved ? 'Bỏ lưu' : 'Lưu tin'}
      className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        saved
          ? 'border-red-300 bg-red-50 text-red-500'
          : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500'
      }`}
    >
      <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
      {saved ? 'Đã lưu' : 'Lưu'}
    </button>
  );
  void listingId;
}
