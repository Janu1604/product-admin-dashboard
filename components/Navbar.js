'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuth, getUser } from '../lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/products" className="font-semibold text-gray-800">
          Product Admin
        </Link>
        <div className="flex items-center gap-4">
          {user?.firstName && (
            <span className="text-sm text-gray-500 hidden sm:inline">Hi, {user.firstName}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
