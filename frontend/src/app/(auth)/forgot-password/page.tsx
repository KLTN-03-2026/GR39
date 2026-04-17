import { Suspense } from 'react';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
