'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';
import Link from 'next/link';

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={openSignIn}
          className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={openSignUp}
          className="bg-primary-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-primary-600 transition-colors"
        >
          Sign Up
        </button>
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary-500 text-white font-semibold flex items-center justify-center hover:bg-primary-600 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || user.email}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="font-semibold text-neutral-900">{user.full_name || 'User'}</p>
            <p className="text-sm text-neutral-500 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Your Profile
            </Link>
            <Link
              href="/upload"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Upload Outfit
            </Link>
            <Link
              href="/moodboard"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Moodboard
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-neutral-100 pt-2">
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
