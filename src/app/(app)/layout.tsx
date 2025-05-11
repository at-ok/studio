import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} Culture Compass. Explore with purpose.
      </footer>
    </div>
  );
}
