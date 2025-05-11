"use client";

import type { ReactNode } from 'react';

// This component can be used to wrap context providers or other client-side setup.
// For now, it just renders children. Add QueryClientProvider, AuthProvider, etc. here as needed.
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
