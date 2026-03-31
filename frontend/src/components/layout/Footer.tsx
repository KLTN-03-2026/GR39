import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
            <Smartphone className="h-5 w-5" />
            PhoneMarket
          </Link>
          <p className="text-sm text-gray-500">
            © 2026 PhoneMarket — Nền tảng mua bán điện thoại tích hợp AI
          </p>
        </div>
      </div>
    </footer>
  );
}
