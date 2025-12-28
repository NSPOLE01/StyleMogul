'use client';

import Link from 'next/link';
import UserMenu from './auth/user-menu';

export default function Navigation() {
  return (
    <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-neutral-900">
            StyleMogul
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/upload"
              className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              Upload
            </Link>
            <Link
              href="/moodboard"
              className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              Moodboard
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
