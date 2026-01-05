'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: '上传文件' },
    { href: '/reports', label: '评审记录' },
    { href: '/admin/dashboard', label: '后台管理' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' && !isAdmin;
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/80 backdrop-blur-md border-b border-[var(--color-border-secondary)]">
      <div className="max-w-[var(--max-width-content)] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[var(--navbar-height)]">
          {/* Logo */}
          <Logo size="md" showText={true} />

          {/* 桌面导航 */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-2 rounded-[var(--radius-base)] text-sm font-medium
                  transition-all duration-[var(--transition-fast)]
                  ${isActive(link.href)
                    ? 'bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            type="button"
            className="md:hidden p-2 rounded-[var(--radius-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-4 py-3 rounded-[var(--radius-base)] text-sm font-medium
                  transition-all duration-[var(--transition-fast)]
                  ${isActive(link.href)
                    ? 'bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
