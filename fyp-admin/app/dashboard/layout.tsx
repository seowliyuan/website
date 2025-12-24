"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { href: '/dashboard/users', label: 'Users', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { href: '/dashboard/foods', label: 'Foods', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { href: '/dashboard/analytics', label: 'Analytics', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { href: '/dashboard/apk', label: 'APK', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )},
    { href: '/dashboard/activity', label: 'Activity Logs', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    // { href: '/dashboard/settings', label: 'Settings', icon: (
    //   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    //   </svg>
    // )},
  ];

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#0f1724] border-r border-gray-800 flex-shrink-0 p-6 overflow-y-auto z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Admin Panel
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile menu on navigation
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 text-indigo-300 font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      // Call logout API endpoint (you'll need to create this)
      const res = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        router.push('/login');
      } else {
        // If no logout endpoint, just clear cookie and redirect
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback: clear cookie and redirect
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1 h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 lg:hidden flex-shrink-0 bg-[#0f1724]">
          <div className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Admin
          </div>
          <div className="flex gap-3 items-center">
            <button
              aria-label="toggle menu"
              onClick={() => setOpen((s) => !s)}
              className="p-2 rounded-md hover:bg-gray-800/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-700" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={open} onClose={() => setOpen(false)} />

          <div className="flex-1 min-w-0 w-full h-screen flex flex-col">
            {/* Desktop Header */}
            <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-gray-800 flex-shrink-0 bg-[#0f1724]">
              <div className="flex items-center gap-4">
                <div className="hidden lg:block text-xl font-semibold text-gray-300">
                  Dashboard
                </div>
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="text-sm text-gray-400 hidden md:block">Admin</div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    A
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-[#0f1724] border border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <div className="text-sm font-medium text-white">Admin User</div>
                        <div className="text-xs text-gray-400">Administrator</div>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

