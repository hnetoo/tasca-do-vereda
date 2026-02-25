'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsSystemPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page with system tab active
    router.push('/settings?tab=system');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
