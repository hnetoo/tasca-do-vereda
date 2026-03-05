'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'DASHBOARD', path: '/owner/mobile' },
  { name: 'POS', path: '/owner/pos' },
  { name: 'PESSOAL', path: '/owner/staff' },
  { name: 'FINANÇAS', path: '/owner/finance' },
  { name: 'SISTEMA', path: '/sistema' },
];

export function OwnerTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-white/10 mb-8 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.path === '/owner' && pathname === '/owner/dashboard');
        
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`
              px-6 py-3 text-xs font-bold tracking-widest transition-all relative
              ${isActive 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            {tab.name}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
