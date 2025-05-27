'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import CaseCard from './CaseCard';
import Modal from '@/components/common/Modal'; // For case detail view

interface CaseListProps {
  initialCases?: Case[]; // For server-side pre-fetching if desired
  onCaseSelected?: (caseData: Case) => void; // Callback when a case is selected from the list
}

const CaseList: React.FC<CaseListProps> = ({ initialCases = [], onCaseSelected }) => {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [loading, setLoading] = useState(!initialCases.length);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true); // Ensure loading is true at the start of fetch
      // Assuming user is authenticated, filter by user_id or implement public access rules
      // const { data: { user } } = await supabase.auth.getUser();
      // For now, fetch all cases as user auth is not implemented
      // const { data: { user } } = await supabase.auth.getUser();

      const { data, error: dbError } = await supabase
        .from('cases')
        .select('*')
        // .eq('userId', user?.id) // Keep this commented until auth is active
        .order('created_at', { ascending: false }); // Corrected to snake_case

      if (dbError) {
        console.error('Error fetching cases:', dbError);
        setError(dbError.message);
      } else if (data) {
        setCases(data as Case[]);
      }
      setLoading(false);
    };

    if (!initialCases.length) {
      fetchCases();
    }

    // Set up a real-time subscription to new cases
    const caseSubscription = supabase
      .channel('public:cases')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('New case received:', payload);
          setCases((prevCases) => [payload.new as Case, ...prevCases].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Corrected to snake_case
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('Case update received:', payload);
          setCases((prevCases) =>
            prevCases.map(c => c.id === payload.new.id ? payload.new as Case : c).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Corrected to snake_case
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('Case delete received:', payload);
          setCases((prevCases) => prevCases.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err);
          setError('Real-time connection failed. Please refresh.');
        }
      });

    return () => {
      supabase.removeChannel(caseSubscription);
    };
  }, [initialCases]);

  const handleCardClick = (caseData: Case) => {
    setSelectedCase(caseData);
    setIsDetailModalOpen(true);
    if (onCaseSelected) {
      onCaseSelected(caseData);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <svg className="animate-spin h-8 w-8 text-fire-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-brand-gray-light">Loading cases...</p>
      </div>
    );
  }
  if (error) return <p className="text-center text-red-400 bg-red-900 p-4 rounded-md">Error loading cases: {error}</p>;

  return (
    <>
      {cases.length === 0 && !loading ? (
        <div className="text-center py-10 px-6 bg-brand-gray-dark rounded-lg shadow-xl">
          <svg className="mx-auto h-12 w-12 text-brand-gray-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-brand-white">No cases found</h3>
          <p className="mt-1 text-sm text-brand-gray-light">
            Get started by creating a new case.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseData={caseItem} onClick={() => handleCardClick(caseItem)} />
          ))}
        </div>
      )}

      {selectedCase && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Case Details: ${selectedCase.title}`}
        >
          <div className="space-y-3 text-brand-gray-light p-1">
            <p><strong className="text-brand-gray-light">ID:</strong> {selectedCase.id}</p>
            <p><strong className="text-brand-gray-light">Location:</strong> {selectedCase.location}</p>
            <p><strong className="text-brand-gray-light">Status:</strong> {selectedCase.status}</p>
            <p><strong className="text-brand-gray-light">Initial Report:</strong> 
              <a 
                href={supabase.storage.from('case-files').getPublicUrl(selectedCase.initialReportPath).data.publicUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-fire-primary hover:text-fire-secondary underline ml-2"
              >
                View Report
              </a>
            </p>
            <p><strong className="text-brand-gray-light">Created:</strong> {new Date(selectedCase.created_at).toLocaleString()}</p> {/* Corrected to snake_case */}
            <p><strong className="text-brand-gray-light">Last Updated:</strong> {new Date(selectedCase.updated_at).toLocaleString()}</p> {/* Corrected to snake_case */}
            {selectedCase.final_report_content && (
              <div>
                <strong className="text-brand-gray-light">Final Report:</strong>
                <div className="mt-1 p-2 border border-brand-gray-medium rounded-md bg-brand-gray-dark max-h-40 overflow-y-auto">
                  {selectedCase.final_report_content}
                </div>
              </div>
            )}
            {/* Add more details or actions here, e.g., edit, generate report button */}
          </div>
        </Modal>
      )}
    </>
  );
};

export default CaseList;
