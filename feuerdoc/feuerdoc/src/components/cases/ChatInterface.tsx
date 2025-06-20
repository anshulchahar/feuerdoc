'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Case } from '@/types';
import { SmartAudioRecorder } from '@/components/audio/SmartAudioRecorder';
import DocumentPreview from '@/components/common/DocumentPreview';
import { supabase } from '@/lib/supabase/client';
import { transcriptAnalysisService, TranscriptAnalysis } from '@/lib/speech-to-text/analysis';
import { useTheme } from '@/contexts/ThemeContext';
import FormattedReport from '@/components/reports/FormattedReport';

interface AudioNote {
  id: string;
  blob: Blob;
  transcript?: string;
  analysis?: TranscriptAnalysis;
  timestamp: Date;
}

interface Message {
  id: string;
  type: 'user' | 'system' | 'report';
  content: string;
  timestamp: Date;
  audioNotes?: AudioNote[];
}

interface ChatInterfaceProps {
  caseData: Case;
  onReportGenerated?: (report: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  caseData, 
  onReportGenerated 
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioNotes, setAudioNotes] = useState<AudioNote[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editedReportContent, setEditedReportContent] = useState('');
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reportTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Force re-render when theme changes
    // This ensures all theme-dependent styling is updated
  }, [theme]);

  useEffect(() => {
    // Initialize empty messages array (removed welcome message)
    setMessages([]);
    
    // Initialize the edited report content when available
    if (caseData?.final_report_content) {
      setEditedReportContent(caseData.final_report_content);
    }
  }, [caseData]);
  
  // Auto-resize effect for report textarea when editing
  useEffect(() => {
    if (isEditingReport && reportTextareaRef.current) {
      reportTextareaRef.current.style.height = 'auto';
      reportTextareaRef.current.style.height = `${reportTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditingReport, editedReportContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && audioNotes.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText || '[Audio notes added]',
      timestamp: new Date(),
      audioNotes: audioNotes.length > 0 ? [...audioNotes] : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setAudioNotes([]);
    
    // Auto-focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      // Combine all user messages and audio notes
      const allNotes = messages
        .filter(m => m.type === 'user')
        .map(m => {
          let content = m.content;
          if (m.audioNotes) {
            const transcripts = m.audioNotes
              .filter(note => note.transcript)
              .map(note => note.transcript)
              .join(' ');
            if (transcripts) {
              content += `\n[Audio Transcript]: ${transcripts}`;
            }
          }
          return content;
        })
        .join('\n\n');

      const allAudioNotes = messages.reduce((acc, m) => {
        if (m.audioNotes) acc.push(...m.audioNotes);
        return acc;
      }, [] as AudioNote[]);

      let audioTranscript = '';
      if (allAudioNotes.length > 0) {
        const transcripts = allAudioNotes
          .filter(note => note.transcript)
          .map(note => {
            let noteText = `[Audio Note ${note.timestamp.toLocaleTimeString()}]: ${note.transcript}`;
            
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
        }
      }

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
          additionalNotes: allNotes,
          audioTranscript: audioTranscript
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { report } = await response.json();
      
      const reportMessage: Message = {
        id: Date.now().toString(),
        type: 'report',
        content: report,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, reportMessage]);
      
      if (onReportGenerated) {
        onReportGenerated(report);
      }

    } catch (error: any) {
      console.error('Error generating report:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error generating report: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAudioRecordingComplete = (audioBlob: Blob, transcript?: string) => {
    const audioNote: AudioNote = {
      id: Date.now().toString(),
      blob: audioBlob,
      transcript,
      timestamp: new Date()
    };

    if (transcript) {
      const analysis = transcriptAnalysisService.analyzeTranscript(transcript);
      audioNote.analysis = analysis;
    }

    setAudioNotes(prev => [...prev, audioNote]);
  };

  const handleTranscriptUpdate = (recordingId: string, transcript: string) => {
    setAudioNotes(prev => prev.map(note => {
      if (note.id === recordingId) {
        const analysis = transcriptAnalysisService.analyzeTranscript(transcript);
        return { ...note, transcript, analysis };
      }
      return note;
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleEditReport = () => {
    setIsEditingReport(true);
  };
  
  const handleSaveReport = async () => {
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({ final_report_content: editedReportContent })
        .eq('id', caseData.id);
        
      if (updateError) {
        console.error('Error saving edited report:', updateError);
        
        // Show error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: `Error saving report: ${updateError.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        setIsEditingReport(false);
        
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: 'Report saved successfully!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Show saved confirmation animation
        setShowSavedConfirmation(true);
        setTimeout(() => {
          setShowSavedConfirmation(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error saving edited report:', err);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error saving report: ${err.message || 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleCancelEdit = () => {
    // Reset to original report content
    setEditedReportContent(caseData.final_report_content || '');
    setIsEditingReport(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const initialReportUrl = supabase.storage.from('case-files').getPublicUrl(caseData.initial_report_path).data.publicUrl;

  return (
    <div 
      className={`flex flex-col h-screen w-full ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}
      data-theme={theme}
      style={{
        backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
        color: theme === 'light' ? '#111827' : '#f9fafb'
      }}
    >
      {/* Header */}
      <div className={`flex-shrink-0 border-b p-4 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
            {caseData.title}
          </h1>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {caseData.location} • Status: {caseData.status}
          </p>
        </div>
      </div>
      
      {/* Final Report Section - Show when report exists */}
      {caseData.final_report_content && (
        <div className={`border-b ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center">
                <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  Final Report
                </h2>
                {showSavedConfirmation && (
                  <span className="ml-3 text-sm px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md animate-pulse">
                    Saved!
                  </span>
                )}
              </div>
              {!isEditingReport ? (
                <button
                  onClick={handleEditReport}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-900 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-200 text-black'
                  }`}
                >
                  Edit Report
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveReport}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                        : 'bg-gray-600 hover:bg-gray-700 text-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div 
              className={`border rounded-lg shadow-sm overflow-hidden ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}
            >
              {!isEditingReport ? (
                <div className="p-4 overflow-auto max-h-[500px]">
                  <FormattedReport content={caseData.final_report_content} />
                </div>
              ) : (
                <div>
                  <textarea
                    ref={reportTextareaRef}
                    value={editedReportContent}
                    onChange={(e) => setEditedReportContent(e.target.value)}
                    className={`w-full p-4 min-h-[400px] resize-none focus:outline-none focus:ring-2 font-mono text-sm leading-relaxed ${
                      theme === 'light' 
                        ? 'bg-white text-gray-900 focus:ring-gray-300' 
                        : 'bg-gray-800 text-gray-100 focus:ring-gray-600'
                    }`}
                    placeholder="## Final Report Title&#10;&#10;### Section Header&#10;- List item&#10;- Another item&#10;&#10;Regular paragraph text."
                  />
                  <div className={`p-2 border-t text-xs ${
                    theme === 'light' 
                      ? 'bg-gray-50 text-gray-600 border-gray-200' 
                      : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}>
                    <p>Markdown supported: ## Heading, ### Subheading, - List item, **Bold**, *Italic*</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user' 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black' 
                  : message.type === 'report'
                  ? theme === 'light'
                    ? 'bg-green-100 text-green-900 border border-green-200'
                    : 'bg-green-900 text-green-100 border border-green-700'
                  : theme === 'light'
                    ? 'bg-white text-gray-900 border border-gray-200'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
              }`}>
                {message.type === 'report' ? (
                  <FormattedReport content={message.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                
                {message.audioNotes && message.audioNotes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-opacity-20">
                    <div className="text-xs opacity-80 mb-2">
                      🎤 {message.audioNotes.length} audio recording(s)
                    </div>
                    {message.audioNotes.map((note, index) => (
                      <div key={note.id} className="text-xs opacity-80">
                        {note.transcript ? (
                          <span>Recording {index + 1}: "{note.transcript.substring(0, 50)}..."</span>
                        ) : (
                          <span>Recording {index + 1}: Processing...</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isGeneratingReport && (
            <div className="flex justify-start">
              <div className={`rounded-lg p-4 max-w-[80%] border ${
                theme === 'light' 
                  ? 'bg-white text-gray-900 border-gray-200' 
                  : 'bg-gray-800 text-gray-100 border-gray-700'
              }`}>
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing reports and generating comprehensive incident report...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Section Header */}
      <div className={`flex-shrink-0 border-t px-4 py-3 ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
              {caseData.final_report_content ? 'Additional Notes & Messages' : 'Case Notes & Messages'}
            </h3>
            
            {/* Initial Report Button */}
            {caseData.initial_report_path && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Initial Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className={`flex-shrink-0 border-t p-4 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Audio Recorder (when active) */}
          {showAudioRecorder && (
            <div className={`mb-4 p-4 border rounded-lg ${
              theme === 'light'
                ? 'bg-red-50 border-red-200'
                : 'bg-red-900/20 border-red-800'
            }`}>
              <SmartAudioRecorder 
                onRecordingComplete={handleAudioRecordingComplete}
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </div>
          )}

          {/* Audio Notes Preview */}
          {audioNotes.length > 0 && (
            <div className={`mb-4 p-3 border rounded-lg ${
              theme === 'light'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-blue-900/20 border-blue-800'
            }`}>
              <div className={`text-sm mb-2 ${
                theme === 'light' ? 'text-blue-800' : 'text-blue-200'
              }`}>
                🎤 {audioNotes.length} audio recording(s) ready to send
              </div>
              {audioNotes.map((note, index) => (
                <div key={note.id} className={`text-xs ${
                  theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                }`}>
                  {note.transcript ? (
                    <span>Recording {index + 1}: "{note.transcript.substring(0, 100)}..."</span>
                  ) : (
                    <span>Recording {index + 1}: Processing transcript...</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input Bar - Capsule Design */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative flex items-center">
              <div className={`flex-1 flex items-center rounded-full border shadow-sm overflow-hidden min-h-[50px] ${
                theme === 'light' 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-600 bg-gray-700'
              }`}>
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Add field notes, observations, actions taken, equipment used..."
                  className={`flex-1 py-3 px-4 pr-24 focus:outline-none resize-none overflow-hidden ${
                    theme === 'light' 
                      ? 'bg-gray-50 text-gray-900 placeholder-gray-500' 
                      : 'bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                
                <div className="flex items-center pr-2">
                  {/* Audio Button */}
                  <button
                    onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                    className={`p-2 rounded-full transition-colors mr-1 ${
                      showAudioRecorder || isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : theme === 'light'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-400'
                    }`}
                    title="Record Audio"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </button>
                
                  {/* Send Button - Integrated in capsule */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() && audioNotes.length === 0}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:cursor-not-allowed ${
                      theme === 'light'
                        ? 'bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white disabled:text-gray-500'
                        : 'bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black disabled:text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Generate Report Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || messages.filter(m => m.type === 'user').length === 0}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded-full transition-colors disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            >
              {isGeneratingReport ? 'Generating...' : caseData.final_report_content ? 'Regenerate Report' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {caseData.initial_report_path && (
        <DocumentPreview
          filePath={caseData.initial_report_path}
          fileName={caseData.initial_report_path.split('/').pop()}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};
