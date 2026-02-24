'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

  pathSegments.forEach((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    // Capitalize the first letter of each segment for display
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ label, path });
  });

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 p-3">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight size={14} className="text-slate-600" />}
          <Link href={item.path} className="hover:text-primary transition-colors">
            {index === 0 ? <Home size={14} /> : item.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
