import { Suspense } from 'react';
import { ListingsContent } from './ListingsContent';

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
