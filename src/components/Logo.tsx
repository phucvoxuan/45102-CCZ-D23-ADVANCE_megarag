'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizeConfig = {
    sm: { container: 'h-6 w-6', image: 24, text: 'text-lg' },
    md: { container: 'h-8 w-8', image: 32, text: 'text-2xl' },
    lg: { container: 'h-12 w-12', image: 48, text: 'text-4xl' },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative flex-shrink-0', config.container)}>
        <Image
          src="/logo.png"
          alt="AIDORag Logo"
          width={config.image}
          height={config.image}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          config.text
        )}>
          AIDO<span className="gradient-text">Rag</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
