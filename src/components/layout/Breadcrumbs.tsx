'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const pathname = usePathname();

  let breadcrumbs = items;
  if (!breadcrumbs) {
    const segments = pathname.split('/').filter(Boolean);
    breadcrumbs = segments.map((seg, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      return { label, href };
    });
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1.5 text-xs text-slate-500 mb-4', className)}>
      <Link
        href="/hr"
        className="flex items-center hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {breadcrumbs.map((item, index) => {
        const isLast = index === (breadcrumbs?.length || 0) - 1;
        return (
          <React.Fragment key={item.label + index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
