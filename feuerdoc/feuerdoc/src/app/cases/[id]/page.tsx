'use client';

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import Link from 'next/link';
// import dynamic from 'next/dynamic';

// const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
// import 'react-quill/dist/quill.snow.css'; // Import Quill styles

// Placeholder for a more sophisticated audio recording component
const AudioRecorder: React.FC<{ onRecordingComplete: (audioBlob: Blob) => void }> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Or appropriate type
        onRecordingComplete(audioBlob);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure permission is granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="my-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-200 mb-2">Record Field Notes (Audio)</h3>
      {!isRecording ? (
        <button 
          onClick={startRecording} 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Start Recording
        </button>
      ) : (
        <button 
          onClick={stopRecording} 
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Stop Recording
        </button>
      )}
      {/* TODO: Add playback for recorded audio if needed */}
    </div>
  );
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [audioNote, setAudioNote] = useState<Blob | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);
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

  const handleGenerateReport = async () => {
    if (!caseData) return;
    setIsGeneratingReport(true);
    setError(null);

    try {
      // Prepare data for Gemini API
      // This is a simplified representation. You'll need to fetch initial report content.
      // For now, we'll just send the path and additional notes.
      const initialReportContent = `Initial Report Path: ${caseData.initialReportPath}. Content needs to be fetched and processed.`; // Placeholder
      let audioTranscript = '';
      if (audioNote) {
        // In a real app, you would send audioNote to a speech-to-text API
        audioTranscript = '[Audio note recorded - transcription would go here]';
      }

      const prompt = `
        Fire Department Case Report Generation
        Case Title: ${caseData.title}
        Case Location: ${caseData.location}
        Initial Report Summary: ${initialReportContent}
        Additional Field Notes (Text): ${additionalNotes}
        Additional Field Notes (Audio Transcript): ${audioTranscript}

        Based on the information above, please generate a comprehensive final fire incident report.
        Include sections for: Incident Overview, Actions Taken, Observations, Contributing Factors, and Conclusion.
      `;

      // Simulate API call to Gemini (replace with actual API call)
      // const response = await callGeminiApi(prompt);
      // For now, simulate a delay and a mock response:
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockReport = `
## Final Fire Incident Report: ${caseData.title}

**Incident Overview:**
On [Date], a fire incident occurred at ${caseData.location}. The initial call was received at [Time]. 
[Details from initial report and field notes about the nature and scale of the fire.]

**Actions Taken:**
Upon arrival, fire crews [Describe actions: e.g., deployed hoses, performed search and rescue, ventilated the structure]. 
[Details from field notes about specific actions, equipment used, and personnel involved.]

**Observations:**
[Detailed observations about the fire scene, structural damage, potential hazards, and any witness statements. Incorporate text and audio notes.]

**Contributing Factors:**
[Analysis of potential causes or factors that contributed to the fire, based on available information.]

**Conclusion & Recommendations:**
The fire was declared under control at [Time]. [Summary of the outcome, any injuries or fatalities, and estimated damages.] 
Recommendations: [e.g., Further investigation by arson team, safety recommendations for the property owner].
      `.trim();
      
      setFinalReport(mockReport);
      // setEditedReport(mockReport);

      // Optionally, save this initial AI-generated report to Supabase immediately
      // Or wait for user to explicitly save after editing.
      // await supabase.from('cases').update({ finalReportContent: mockReport, status: 'InProgress' }).eq('id', caseId);

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

  if (loading) return <div className="text-center py-10 text-gray-400">Loading case details...</div>;
  if (error && !caseData) return <div className="text-center py-10 text-red-500 bg-red-900 p-4 rounded-md">Error: {error} <Link href="/" className="text-fire-primary hover:underline">Go to Dashboard</Link></div>;
  if (!caseData) return <div className="text-center py-10 text-gray-400">Case not found. <Link href="/" className="text-fire-primary hover:underline">Go to Dashboard</Link></div>;

  const initialReportUrl = supabase.storage.from('case-files').getPublicUrl(caseData.initial_report_path).data.publicUrl;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-3xl md:text-4xl font-bold text-fire-primary mb-2">{caseData.title}</h1>
        <p className="text-lg text-gray-400">Location: {caseData.location}</p>
        <p className="text-sm text-gray-500">Status: <span className={`font-semibold ${caseData.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>{caseData.status}</span></p>
      </div>

      {error && <p className="my-4 text-red-500 bg-red-900 p-3 rounded-md">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Section 1: Initial Report & Inputs */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Case Inputs</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Initial Contact Report</h3>
            {caseData.initialReportPath ? (
              <a 
                href={initialReportUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-fire-primary hover:underline hover:text-fire-secondary transition-colors inline-flex items-center"
              >
                View Initial Report Document
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <p className="text-gray-500">No initial report document uploaded.</p>
            )}
            {/* TODO: Consider embedding PDF/DOC viewer if feasible and necessary */}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Additional Field Notes (Text)</h3>
            <textarea
              value={additionalNotes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
              rows={5}
              placeholder="Enter any additional observations, actions, or notes..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-fire-primary focus:border-fire-primary text-gray-200 placeholder-gray-500"
            />
          </div>

          <AudioRecorder onRecordingComplete={setAudioNote} />
          {audioNote && <p className="text-sm text-green-400 mt-2">Audio note recorded ({Math.round(audioNote.size / 1024)} KB). It will be included in the report generation.</p>}

          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || !caseData}
            className="w-full mt-4 bg-fire-primary hover:bg-fire-secondary text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-fire"
          >
            {isGeneratingReport ? 'Generating Report...' : 'Generate Final Report (AI)'}
          </button>
        </div>

        {/* Section 2: Final Report Display & Edit */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Final Report</h2>
          {finalReport !== null ? (
            <div>
              {/* Using a simple textarea for editing for now. Replace with ReactQuill or similar for rich text */}
              <textarea 
                value={finalReport} // Or editedReport if using a separate state for edits
                onChange={(e) => setFinalReport(e.target.value)} // Or setEditedReport
                rows={15}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-fire-primary focus:border-fire-primary text-gray-200 mb-4 h-96 resize-y"
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
            <div className="text-center py-10 text-gray-500">
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
    </div>
  );
}
