'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types'; // Full Case type
import { usePathname } from 'next/navigation';

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
        .order('createdAt', { ascending: false });

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
    <aside className="w-72 bg-gray-900 p-5 border-r border-gray-700 flex flex-col h-screen shadow-lg">
      <div className="mb-10">
        <Link href="/" className="text-3xl font-bold text-fire-primary hover:text-fire-secondary transition-colors">
          FeuerDoc
        </Link>
      </div>
      <nav className="flex-grow overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <Link 
          href="/"
          className={`block py-2 px-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${pathname === '/' ? 'bg-gray-700 text-white' : ''}`}
        >
          Dashboard
        </Link>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3 mt-4">Cases</h3>
          {isLoading ? (
            <p className="text-gray-400 px-3 text-sm">Loading cases...</p>
          ) : cases.length === 0 ? (
            <p className="text-gray-400 px-3 text-sm">No cases yet.</p>
          ) : (
            <ul className="space-y-1">
              {cases.map((caseItem) => (
                <li key={caseItem.id}>
                  <Link 
                    href={`/cases/${caseItem.id}`}
                    className={`block py-2 px-3 rounded-md text-sm text-gray-400 hover:bg-gray-700 hover:text-white truncate transition-colors ${pathname === `/cases/${caseItem.id}` ? 'bg-gray-700 text-white' : ''}`}
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
      <div className="mt-auto pt-4 border-t border-gray-700">
        {/* User profile/logout can go here */}
        <p className="text-xs text-gray-500 text-center">© {new Date().getFullYear()} FeuerDoc</p>
      </div>
    </aside>
  );
};

export default Sidebar;
