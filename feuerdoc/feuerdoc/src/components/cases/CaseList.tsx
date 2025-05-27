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
      // Assuming user is authenticated, filter by user_id or implement public access rules
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Handle case where user is not logged in, or adjust query accordingly
        // For now, we'll fetch all if no user, or you can restrict this.
        // setError("User not authenticated. Please log in to see cases.");
        // setLoading(false);
        // return;
      }

      const { data, error: dbError } = await supabase
        .from('cases')
        .select('*')
        // .eq('userId', user.id) // Uncomment to filter by user if auth is set up
        .order('createdAt', { ascending: false });

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
          setCases((prevCases) => [payload.new as Case, ...prevCases]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        (payload) => {
          setCases((prevCases) => 
            prevCases.map(c => c.id === payload.new.id ? payload.new as Case : c)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cases' },
        (payload) => {
          setCases((prevCases) => prevCases.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe();

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

  if (loading) return <p className="text-gray-400">Loading cases...</p>;
  if (error) return <p className="text-red-500">Error loading cases: {error}</p>;

  return (
    <div className="space-y-4">
      {cases.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No cases found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((caseData) => (
            <CaseCard key={caseData.id} caseData={caseData} onClick={() => handleCardClick(caseData)} />
          ))}
        </div>
      )}

      {selectedCase && (
        <Modal 
          isOpen={isDetailModalOpen} 
          onClose={() => setIsDetailModalOpen(false)} 
          title={selectedCase.title}
        >
          {/* Case Detail View Content */}
          <div className="text-gray-300">
            <p><span className="font-semibold">Location:</span> {selectedCase.location}</p>
            <p><span className="font-semibold">Status:</span> {selectedCase.status}</p>
            <p><span className="font-semibold">Initial Report:</span> 
              <a 
                href={supabase.storage.from('case-files').getPublicUrl(selectedCase.initialReportPath).data.publicUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-fire-primary hover:underline ml-1"
              >
                View Report
              </a>
            </p>
            <p><span className="font-semibold">Created:</span> {new Date(selectedCase.createdAt).toLocaleString()}</p>
            <p><span className="font-semibold">Last Updated:</span> {new Date(selectedCase.updatedAt).toLocaleString()}</p>
            {selectedCase.finalReportContent && (
              <div className="mt-4">
                <h4 className="font-semibold mb-1">Final Report Summary:</h4>
                <div className="prose prose-sm prose-invert max-h-48 overflow-y-auto bg-gray-800 p-2 rounded">
                  {/* This will be plain text for now, rich text display can be added later */}
                  {selectedCase.finalReportContent.substring(0, 300)}...
                </div>
              </div>
            )}
            {/* TODO: Add button to navigate to full case page / report generation page */}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CaseList;
