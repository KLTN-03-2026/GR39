import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
// Footer removed — design không có footer

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'PhoneMarket — Mua bán điện thoại tích hợp AI',
  description: 'Nền tảng mua bán điện thoại cũ với định giá AI tự động, minh bạch và an toàn',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="text-on-surface min-h-screen" suppressHydrationWarning>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
