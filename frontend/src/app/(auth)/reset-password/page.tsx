import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
