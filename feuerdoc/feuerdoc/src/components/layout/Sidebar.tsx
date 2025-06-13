'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types'; // Full Case type
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/common/ThemeToggle';

// Define a specific type for sidebar cases if only a subset of fields is needed
interface SidebarCase {
  id: string;
  title: string;
}

const Sidebar = () => {
  const [cases, setCases] = useState<SidebarCase[]>([]); // Use SidebarCase type
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('id, title')
        .order('created_at', { ascending: false }); // Corrected to snake_case

      if (error) {
        console.error('Error fetching cases for sidebar:', error);
        setCases([]); // Set to empty array on error
      } else if (data) {
        setCases(data as SidebarCase[]); // Cast to SidebarCase[]
      }
      setIsLoading(false);
    };

    fetchCases();

    const caseSubscription = supabase
      .channel('public:cases:sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        (payload) => {
          // Refetch or update intelligently
          // For simplicity, refetching. For optimization, update based on payload.
          fetchCases(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(caseSubscription);
    };
  }, []);

  return (
    <aside className="w-72 glass-sidebar p-5 flex flex-col h-screen shadow-lg transition-colors duration-300">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-red-600 hover:text-red-700 transition-colors">
          Feuerdok
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-grow overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-gray-100 dark:scrollbar-track-gray-900">
        <Link 
          href="/"
          className={`block py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors ${pathname === '/' ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : ''}`}
        >
          Dashboard
        </Link>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2 px-3 mt-4">Cases</h3>
          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400 px-3 text-sm">Loading cases...</p>
          ) : cases.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 px-3 text-sm">No cases yet.</p>
          ) : (
            <ul className="space-y-1">
              {cases.map((caseItem) => (
                <li key={caseItem.id}>
                  <Link 
                    href={`/cases/${caseItem.id}`}
                    className={`block py-2 px-3 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white truncate transition-colors ${pathname === `/cases/${caseItem.id}` ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : ''}`}
                    title={caseItem.title}
                  >
                    {caseItem.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Add other navigation items here */}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* User profile/logout can go here */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">© {new Date().getFullYear()} Feuerdok</p>
      </div>
    </aside>
  );
};

export default Sidebar;
