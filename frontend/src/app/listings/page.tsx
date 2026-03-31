import { Suspense } from 'react';
import { ListingsContent } from './ListingsContent';

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
