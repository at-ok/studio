import { Compass } from 'lucide-react';
import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <Link href="/discover" className="flex items-center gap-2 group">
      <Compass className={`${iconSize} text-primary group-hover:animate-spin-slow`} />
      <span className={`${textSize} font-bold text-primary group-hover:text-primary/90 transition-colors`}>
        Culture Compass
      </span>
    </Link>
  );
}

// Add custom animation to tailwind.config.ts if not already present
// keyframes: { 'spin-slow': { '0%, 100%': { transform: 'rotate(0deg)' }, '50%': { transform: 'rotate(15deg)' } } },
// animation: { 'spin-slow': 'spin-slow 3s ease-in-out infinite' }
// For now, we'll rely on existing animations or simple hover effects.
