'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  description?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavDropdownProps {
  label: string;
  items: NavItem[];
  className?: string;
}

export function NavDropdown({ label, items, className }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      ref={dropdownRef}
      className={cn('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors',
          'text-[var(--landing-text-secondary)] hover:text-white',
          isOpen && 'text-white'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu with Glassmorphism */}
      <div
        className={cn(
          'absolute top-full left-0 mt-2 w-72 rounded-xl transition-all duration-200',
          'bg-[var(--landing-bg-card)] backdrop-blur-xl',
          'border border-white/10 shadow-2xl',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="p-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-all duration-200',
                'hover:bg-white/10',
                'group'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.icon && (
                <div className="mt-0.5 flex-shrink-0">
                  <item.icon className="h-5 w-5 text-[var(--landing-cyan)] group-hover:text-[var(--landing-primary)] transition-colors" />
                </div>
              )}
              <div>
                <div className="font-medium text-sm text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-xs text-[var(--landing-text-muted)] mt-0.5 group-hover:text-[var(--landing-text-secondary)] transition-colors">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile version
interface MobileNavDropdownProps extends NavDropdownProps {
  onItemClick?: () => void;
}

export function MobileNavDropdown({ label, items, onItemClick }: MobileNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 pb-2 mb-2">
      <button
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200 text-[var(--landing-text-secondary)]',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pl-4 pt-2 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 py-2 text-sm text-[var(--landing-text-secondary)] hover:text-[var(--landing-cyan)] transition-colors"
              onClick={() => {
                setIsOpen(false);
                onItemClick?.();
              }}
            >
              {item.icon && <item.icon className="h-4 w-4 text-[var(--landing-cyan)]" />}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
