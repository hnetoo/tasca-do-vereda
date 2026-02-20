'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HorizontalMenuItem {
  path: string;
  label: string;
}

interface HorizontalNavbarProps {
  menuItems: HorizontalMenuItem[];
  basePath: string; // O caminho base para a página principal (ex: /sistema)
}

const HorizontalNavbar: React.FC<HorizontalNavbarProps> = ({ menuItems, basePath }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || (path === basePath && pathname === basePath);

  return (
    <nav className="bg-white shadow-sm py-3 px-4 md:px-6 border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`relative text-lg font-medium transition-colors pb-2 
                  ${isActive(item.path) 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          <span className="ml-2">Menu</span>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 border-t border-gray-200 pt-3">
          <ul className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  className={`block px-4 py-2 text-md font-medium rounded-lg transition-colors
                    ${isActive(item.path) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on item click
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default HorizontalNavbar;
