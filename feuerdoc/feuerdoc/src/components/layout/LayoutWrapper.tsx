'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Identify individual case detail pages (ChatGPT-like interface)
  // The pattern /cases/[uuid] for case detail pages
  const isCaseDetailPage = pathname?.match(/^\/cases\/[a-f0-9-]{36}$/) !== null;
  
  if (isCaseDetailPage) {
    return (
      <div className="h-screen flex">
        {/* Fixed Sidebar - Always visible */}
        <div 
          data-sidebar
          className="h-full z-40"
        >
          <Sidebar />
        </div>

        {/* Main Content Area - Always with sidebar space */}
        <div className="flex-1 h-screen">
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
