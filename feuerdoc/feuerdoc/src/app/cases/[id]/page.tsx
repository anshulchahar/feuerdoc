'use client';

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import Link from 'next/link';
import DocumentPreview from '@/components/common/DocumentPreview';
import { SmartAudioRecorder } from '@/components/audio/SmartAudioRecorder';
import { transcriptAnalysisService, TranscriptAnalysis } from '@/lib/speech-to-text/analysis';
// import dynamic from 'next/dynamic';

// const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
// import 'react-quill/dist/quill.snow.css'; // Import Quill styles

interface AudioNote {
  id: string;
  blob: Blob;
  transcript?: string;
  analysis?: TranscriptAnalysis;
  timestamp: Date;
}

interface AudioNote {
  id: string;
  blob: Blob;
  transcript?: string;
  analysis?: TranscriptAnalysis;
  timestamp: Date;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [audioNotes, setAudioNotes] = useState<AudioNote[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [combinedTranscript, setCombinedTranscript] = useState<string>('');
  // const [editedReport, setEditedReport] = useState<string>('');

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
        setFinalReport(data.final_report_content || null); // Corrected to snake_case
        // setEditedReport(data.final_report_content || '');
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
          setFinalReport(payload.new.final_report_content || null); // Corrected to snake_case
          // setEditedReport(payload.new.final_report_content || '');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(caseSubscription);
    };
  }, [caseId]);

  const handleAudioRecordingComplete = (audioBlob: Blob, transcript?: string) => {
    const audioNote: AudioNote = {
      id: Date.now().toString(),
      blob: audioBlob,
      transcript,
      timestamp: new Date()
    };

    if (transcript) {
      // Analyze the transcript for incident details
      const analysis = transcriptAnalysisService.analyzeTranscript(transcript);
      audioNote.analysis = analysis;
    }

    setAudioNotes(prev => [...prev, audioNote]);
    updateCombinedTranscript();
  };

  const handleTranscriptUpdate = (recordingId: string, transcript: string) => {
    setAudioNotes(prev => prev.map(note => {
      if (note.id === recordingId) {
        const analysis = transcriptAnalysisService.analyzeTranscript(transcript);
        return { ...note, transcript, analysis };
      }
      return note;
    }));
    updateCombinedTranscript();
  };

  const updateCombinedTranscript = () => {
    const transcripts = audioNotes
      .filter(note => note.transcript)
      .map(note => note.transcript)
      .join(' ');
    setCombinedTranscript(transcripts);
  };

  const handleGenerateReport = async () => {
    if (!caseData) return;
    setIsGeneratingReport(true);
    setError(null);

    try {
      // Prepare comprehensive audio transcript with incident analysis
      let audioTranscript = '';
      if (audioNotes.length > 0) {
        const transcripts = audioNotes
          .filter(note => note.transcript)
          .map(note => {
            let noteText = `[Audio Note ${note.timestamp.toLocaleTimeString()}]: ${note.transcript}`;
            
            // Add analysis details if available
            if (note.analysis) {
              const details = note.analysis.incidentDetails;
              const analysisText = [];
              
              if (details.actions && details.actions.length > 0) {
                analysisText.push(`Actions identified: ${details.actions.join(', ')}`);
              }
              if (details.equipment && details.equipment.length > 0) {
                analysisText.push(`Equipment mentioned: ${details.equipment.join(', ')}`);
              }
              if (details.personnel && details.personnel.length > 0) {
                analysisText.push(`Personnel: ${details.personnel.join(', ')}`);
              }
              if (details.hazards && details.hazards.length > 0) {
                analysisText.push(`Hazards: ${details.hazards.join(', ')}`);
              }
              
              if (analysisText.length > 0) {
                noteText += `\n[Extracted Details]: ${analysisText.join('; ')}`;
              }
            }
            
            return noteText;
          });

        if (transcripts.length > 0) {
          audioTranscript = `AUDIO TRANSCRIPTION AND ANALYSIS:\n${transcripts.join('\n\n')}`;
        } else {
          const totalSize = audioNotes.reduce((sum, note) => sum + note.blob.size, 0);
          audioTranscript = `[${audioNotes.length} audio note(s) recorded with total size of ${Math.round(totalSize / 1024)} KB. Speech-to-text processing completed.]`;
        }
      }

      // Call the actual API route for report generation
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: caseData.id,
          caseTitle: caseData.title,
          caseLocation: caseData.location,
          initialReportPath: caseData.initial_report_path,
          additionalNotes: additionalNotes,
          audioTranscript: audioTranscript
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { report } = await response.json();
      setFinalReport(report);

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSaveReport = async () => {
    if (!caseId || finalReport === null) return;
    // const contentToSave = editedReport;
    const contentToSave = finalReport; // In a real scenario, this would be from the rich text editor

    setIsGeneratingReport(true); // Reuse loading state for saving
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({ final_report_content: contentToSave, status: 'Completed' }) // Corrected to snake_case
        .eq('id', caseId);
      if (updateError) throw updateError;
      alert('Report saved successfully!');
      // Optionally, update local state if not relying solely on real-time updates
      setCaseData(prev => prev ? { ...prev, final_report_content: contentToSave, status: 'Completed' } : null); // Corrected to snake_case
    } catch (err: any) {
      console.error('Error saving report:', err);
      setError(err.message || 'Failed to save report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDiscardReport = () => {
    setFinalReport(caseData?.final_report_content || null); // Revert to last saved or null
    // setEditedReport(caseData?.final_report_content || '');
    alert('Changes discarded.');
  };

  if (loading) return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading case details...</div>;
  if (error && !caseData) return <div className="text-center py-10 text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 p-4 rounded-md">Error: {error} <Link href="/" className="text-fire-primary hover:underline">Go to Dashboard</Link></div>;
  if (!caseData) return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Case not found. <Link href="/" className="text-fire-primary hover:underline">Go to Dashboard</Link></div>;

  const initialReportUrl = supabase.storage.from('case-files').getPublicUrl(caseData.initial_report_path).data.publicUrl;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-800">
        <h1 className="text-3xl md:text-4xl font-bold text-fire-primary mb-2">{caseData.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Location: {caseData.location}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Status: <span className={`font-semibold ${caseData.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{caseData.status}</span></p>
      </div>

      {error && <p className="my-4 text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 p-3 rounded-md">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Section 1: Initial Report & Inputs */}
        <div className="glass-card p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Case Inputs</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Initial Contact Report</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">This document contains the initial incident information that will be processed and combined with your field notes to generate the final report.</p>
            {caseData.initial_report_path ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 bg-fire-primary hover:bg-fire-secondary text-white px-4 py-2 rounded-md transition-colors inline-flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Document
                </button>
                <a 
                  href={initialReportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download
                </a>
              </div>
            ) : (
              <p className="text-gray-500">No initial report document uploaded.</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Additional Field Notes (Text)</h3>
            <p className="text-xs text-gray-400 mb-2">Include details such as: arrival times, actions taken, equipment used, personnel involved, observations, witness statements, damage assessment, hazards, weather conditions, etc.</p>
            <textarea
              value={additionalNotes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
              rows={5}
              placeholder="Enter additional field observations, actions taken, equipment used, personnel involved, witness statements, structural damage, hazards encountered, etc..."
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md focus:ring-fire-primary focus:border-fire-primary text-gray-200 placeholder-gray-500"
            />
          </div>

          <SmartAudioRecorder 
            onRecordingComplete={handleAudioRecordingComplete}
            onTranscriptUpdate={handleTranscriptUpdate}
          />
          
          {audioNotes.length > 0 && (
            <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-md">
              <h4 className="text-sm font-medium text-green-300 mb-2">Audio Notes Summary</h4>
              <div className="space-y-2 text-sm text-green-200">
                <p>{audioNotes.length} audio recording(s) captured</p>
                <p>Total size: {Math.round(audioNotes.reduce((sum, note) => sum + note.blob.size, 0) / 1024)} KB</p>
                
                {/* Show transcription status */}
                <div className="space-y-1">
                  {audioNotes.map((note, index) => (
                    <div key={note.id} className="flex items-center gap-2">
                      <span className="text-xs">Recording {index + 1}:</span>
                      {note.transcript ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Transcribed ({note.transcript.split(' ').length} words)
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">Processing...</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Show analysis summary if available */}
                {audioNotes.some(note => note.analysis) && (
                  <div className="mt-2 pt-2 border-t border-green-600">
                    <div className="text-xs text-green-300 mb-1">Incident Details Extracted:</div>
                    {audioNotes.filter(note => note.analysis).map((note, index) => (
                      <div key={note.id} className="text-xs text-green-200 ml-2">
                        • {note.analysis?.summary}
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-green-400 mt-2">
                  ✅ Speech-to-text processing active. Incident details, observations, and actions are being automatically extracted from recordings.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || !caseData}
            className="w-full mt-4 bg-fire-primary hover:bg-fire-secondary text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingReport ? 'Analyzing Reports & Generating...' : 'Generate Final Report with AI'}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            AI will analyze the initial report and combine it with your field notes to create a comprehensive final incident report.
          </p>
        </div>

        {/* Section 2: Final Report Display & Edit */}
        <div className="glass-card p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Final Report</h2>
          {finalReport !== null ? (
            <div>
              {/* Using a simple textarea for editing for now. Replace with ReactQuill or similar for rich text */}
              <textarea 
                value={finalReport} // Or editedReport if using a separate state for edits
                onChange={(e) => setFinalReport(e.target.value)} // Or setEditedReport
                rows={15}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-fire-primary focus:border-fire-primary text-gray-900 dark:text-gray-200 mb-4 h-96 resize-y"
                placeholder="Final report will appear here..."
              />
              {/* <ReactQuill 
                theme="snow"
                value={editedReport}
                onChange={setEditedReport}
                className="bg-gray-700 text-gray-200 rounded-md h-80 mb-4 [&_.ql-editor]:text-gray-200 [&_.ql-toolbar]:border-gray-600 [&_.ql-container]:border-gray-600"
              /> */}
              <div className="flex space-x-3 mt-4">
                <button 
                  onClick={handleSaveReport} 
                  disabled={isGeneratingReport}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-60"
                >
                  {isGeneratingReport ? 'Saving...' : 'Save Report'}
                </button>
                <button 
                  onClick={handleDiscardReport} 
                  disabled={isGeneratingReport}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-60"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600 dark:text-gray-500">
              <p>No final report generated yet, or the case is still open.</p>
              <p>Use the controls on the left to input details and generate the report.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-fire-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Document Preview Modal */}
      {caseData?.initial_report_path && (
        <DocumentPreview
          filePath={caseData.initial_report_path}
          fileName={caseData.initial_report_path.split('/').pop()}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
