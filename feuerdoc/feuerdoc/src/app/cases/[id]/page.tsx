'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import Link from 'next/link';
import { ChatInterface } from '@/components/cases/ChatInterface';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchCaseDetails = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (dbError) {
        console.error('Error fetching case details:', dbError);
        setError('Case not found or error fetching details.');
        setCaseData(null);
      } else if (data) {
        setCaseData(data as Case);
      }
      setLoading(false);
    };

    fetchCaseDetails();

    // Optional: Real-time updates for this specific case
    const caseSubscription = supabase
      .channel(`public:cases:id=${caseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` },
        (payload) => {
          setCaseData(payload.new as Case);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(caseSubscription);
    };
  }, [caseId]);

  const handleReportGenerated = async (report: string) => {
    // Save the generated report to the database
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({ final_report_content: report, status: 'Completed' })
        .eq('id', caseId);
        
      if (updateError) {
        console.error('Error saving report:', updateError);
      } else {
        // Update local state
        setCaseData(prev => prev ? { ...prev, final_report_content: report, status: 'Completed' } : null);
      }
    } catch (err: any) {
      console.error('Error saving report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-fire-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-100 dark:bg-red-900 rounded-lg">
          <p className="text-red-600 dark:text-red-500 mb-4">Error: {error}</p>
          <Link href="/" className="text-fire-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Case not found.</p>
          <Link href="/" className="text-fire-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface 
      caseData={caseData} 
      onReportGenerated={handleReportGenerated}
    />
  );
}
