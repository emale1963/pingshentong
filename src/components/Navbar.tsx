'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              建筑可研评审
            </Link>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition ${
                !isAdmin && pathname === '/' ? 'bg-blue-800' : ''
              }`}
            >
              报告提交
            </Link>
            <Link
              href="/reports"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition ${
                pathname === '/reports' ? 'bg-blue-800' : ''
              }`}
            >
              我的报告
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              后台管理
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

