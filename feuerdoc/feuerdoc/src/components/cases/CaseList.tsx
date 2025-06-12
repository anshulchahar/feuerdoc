'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import CaseCard from './CaseCard';
import Modal from '@/components/common/Modal';
import DocumentPreview from '@/components/common/DocumentPreview';
import QuickActions from '@/components/common/QuickActions';
import ViewToggle, { ViewMode } from '@/components/common/ViewToggle';
import CaseListView from './CaseListView';
import { useTheme } from '@/contexts/ThemeContext';

// Define types locally since we removed SearchAndSort
export type StatusFilter = 'all' | 'Open' | 'InProgress' | 'Completed' | 'Closed';

interface CaseListProps {
  initialCases?: Case[];
  onCaseSelected?: (caseData: Case) => void;
}

export interface CaseListRef {
  refreshCases: () => void;
}

const CaseList = forwardRef<CaseListRef, CaseListProps>(({ initialCases = [], onCaseSelected }, ref) => {
  const { theme } = useTheme();
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [loading, setLoading] = useState(!initialCases.length);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Search and filter state (simplified - removed sort controls)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching cases:', dbError);
        setError(dbError.message);
        setCases([]); // Clear cases on error
      } else if (dbData) {
        setCases(dbData as Case[]);
      }
    } catch (e: any) {
      console.error('Exception fetching cases:', e);
      setError(e.message || 'Failed to load cases');
      setCases([]); // Clear cases on error
    } finally {
      setLoading(false);
    }
  };

  // Expose the refreshCases method to parent components
  useImperativeHandle(ref, () => ({
    refreshCases: fetchCases,
  }));

  useEffect(() => {
    let isMounted = true;
    const channelName = 'public:cases';

    const fetchCasesWithMountCheck = async () => {
      if (!isMounted) return;
      await fetchCases();
    };

    if (initialCases.length > 0) {
      // If initialCases are provided, use them and don't fetch initially.
      // This branch is not hit when CaseList is used on HomePage as it provides no initialCases.
      setCases(initialCases);
      setLoading(false);
    } else {
      // No initial cases, so fetch them.
      fetchCasesWithMountCheck();
    }

    const caseSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cases' },
        (payload) => {
          if (isMounted) {
            console.log('New case received via subscription:', payload);
            setCases((prevCases) => [payload.new as Case, ...prevCases].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        (payload) => {
          if (isMounted) {
            console.log('Case update received via subscription:', payload);
            setCases((prevCases) =>
              prevCases.map(c => c.id === payload.new.id ? payload.new as Case : c).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cases' },
        (payload) => {
          if (isMounted) {
            console.log('Case delete received via subscription:', payload);
            setCases((prevCases) => prevCases.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe((status, err) => {
        if (isMounted) {
          if (err) {
            console.error('Subscription error:', err);
            setError('Real-time connection failed. Please refresh.');
          }
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(caseSubscription);
    };
  }, []); // Empty dependency array

  // Memoized filtered cases (removed sorting functionality)
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((caseItem) =>
        caseItem.title.toLowerCase().includes(query) ||
        caseItem.location.toLowerCase().includes(query) ||
        caseItem.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((caseItem) => caseItem.status === statusFilter);
    }

    // Default sort by created_at desc (most recent first)
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [cases, searchQuery, statusFilter]);

  // Handlers for search and filter (removed sort handlers)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleInfoClick = (caseData: Case) => {
    setSelectedCase(caseData);
    setIsDetailModalOpen(true);
    if (onCaseSelected) {
      onCaseSelected(caseData);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <svg className="animate-spin h-8 w-8 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-brand-gray-light">Loading cases...</p>
      </div>
    );
  }
  if (error) return <p className="text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">Error loading cases: {error}</p>;

  return (
    <>
      {/* Quick Actions Bar with enhanced functionality */}
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl mb-6 shadow-sm backdrop-blur-sm"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search cases by title, location, or status..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white transition-all duration-200 shadow-sm focus:shadow-md"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-4">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            
            {/* Results Summary */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedCases.length} of {cases.length} cases
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Filters */}
      <QuickActions
        onStatusFilter={setStatusFilter}
        onClearFilters={handleClearFilters}
        totalCases={cases.length}
        filteredCases={filteredAndSortedCases.length}
        currentFilters={{
          search: searchQuery,
          status: statusFilter,
        }}
      />

      {filteredAndSortedCases.length === 0 && !loading ? (
        <div className="text-center py-10 px-6 bg-brand-gray-dark rounded-lg">
          <svg className="mx-auto h-12 w-12 text-brand-gray-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-brand-white">
            {cases.length === 0 ? 'No cases found' : 'No matching cases'}
          </h3>
          <p className="mt-1 text-sm text-brand-gray-light">
            {cases.length === 0 
              ? 'Get started by creating a new case.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredAndSortedCases.map((caseItem) => (
            viewMode === 'grid' ? (
              <CaseCard 
                key={caseItem.id} 
                caseData={caseItem} 
                onInfoClick={() => handleInfoClick(caseItem)}
                onEditClick={() => {}}
              />
            ) : (
              <CaseListView
                key={caseItem.id}
                caseData={caseItem}
                onInfoClick={() => handleInfoClick(caseItem)}
                onEditClick={() => {}}
              />
            )
          ))}
        </div>
      )}

      {selectedCase && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Case Details: ${selectedCase.title}`}
        >
          <div className={`space-y-3 p-1 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            <p><strong className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Location:</strong> {selectedCase.location}</p>
            <p><strong className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Status:</strong> {selectedCase.status}</p>
            <p><strong className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Initial Report:</strong></p>
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className={`px-3 py-1 rounded-md transition-colors text-sm ${
                  theme === 'light'
                    ? 'bg-gray-900 hover:bg-gray-700 text-white'
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                Preview Report
              </button>
              <a 
                href={supabase.storage.from('case-files').getPublicUrl(selectedCase.initial_report_path).data.publicUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
              >
                Download
              </a>
            </div>
            <p><strong className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Created:</strong> {new Date(selectedCase.created_at).toLocaleString()}</p>
            {selectedCase.final_report_content && (
              <div>
                <strong className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Final Report:</strong>
                <div className={`mt-1 p-2 border rounded-md max-h-40 overflow-y-auto ${
                  theme === 'light'
                    ? 'border-gray-200 bg-gray-50 text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-white'
                }`}>
                  {selectedCase.final_report_content}
                </div>
              </div>
            )}
            {/* Add more details or actions here, e.g., edit, generate report button */}
          </div>
        </Modal>
      )}

      {/* Document Preview Modal */}
      {selectedCase?.initial_report_path && (
        <DocumentPreview
          filePath={selectedCase.initial_report_path}
          fileName={selectedCase.initial_report_path.split('/').pop()}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
});

CaseList.displayName = 'CaseList';

export default CaseList;
