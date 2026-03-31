import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CallbackHandler } from './CallbackHandler';

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
      <div className="text-center">
        <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />}>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
