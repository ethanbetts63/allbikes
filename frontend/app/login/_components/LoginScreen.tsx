'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from '@/forms/LoginForm';
import { checkSession } from '@/api';

/** Sends an already-signed-in admin straight through to the dashboard. */
export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    checkSession().then((profile) => {
      if (profile) router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className="bg-background flex h-full flex-col items-center justify-center py-12">
      <LoginForm className="w-full max-w-lg" />
    </div>
  );
}
