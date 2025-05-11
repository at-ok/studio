"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Simulate auth check or direct redirect
    // In a real app, check auth state here
    // For now, redirect to /discover
    // This could also redirect to /auth/signin if user is not authenticated
    router.replace('/discover');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Loading Culture Compass...</p>
    </div>
  );
}
