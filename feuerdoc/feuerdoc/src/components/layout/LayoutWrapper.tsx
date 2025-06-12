'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useState, useEffect } from 'react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Hide sidebar only on individual case detail pages (ChatGPT-like interface)
  // The pattern /cases/[uuid] should hide the sidebar
  const isCaseDetailPage = pathname?.match(/^\/cases\/[a-f0-9-]{36}$/) !== null;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && isCaseDetailPage) {
        const target = event.target as Element;
        const sidebar = document.querySelector('[data-sidebar]');
        const hamburger = document.querySelector('[data-hamburger]');
        
        if (sidebar && hamburger && !sidebar.contains(target) && !hamburger.contains(target)) {
          // Only close on mobile/tablet screens
          if (window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, isCaseDetailPage]);
  
  if (isCaseDetailPage) {
    return (
      <div className="h-screen relative">
        {/* Hamburger Menu Button */}
        <button
          data-hamburger
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md shadow-lg transition-colors"
          title="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sliding Sidebar */}
        <div 
          data-sidebar
          className={`fixed left-0 top-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Main Content Area - Always visible, shifts when sidebar opens */}
        <div className={`h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-72' : 'ml-0'
        }`}>
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;
