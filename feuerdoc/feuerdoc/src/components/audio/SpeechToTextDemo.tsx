// Demo component to showcase speech-to-text capabilities
// This component can be used to test the speech-to-text functionality

import React, { useState } from 'react';
import { SmartAudioRecorder } from '@/components/audio/SmartAudioRecorder';
import { transcriptAnalysisService, TranscriptAnalysis } from '@/lib/speech-to-text/analysis';

interface DemoAudioNote {
  id: string;
  blob: Blob;
  transcript?: string;
  analysis?: TranscriptAnalysis;
  timestamp: Date;
}

export const SpeechToTextDemo: React.FC = () => {
  const [audioNotes, setAudioNotes] = useState<DemoAudioNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<DemoAudioNote | null>(null);

  const handleAudioRecordingComplete = (audioBlob: Blob, transcript?: string) => {
    const audioNote: DemoAudioNote = {
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

  const clearAllNotes = () => {
    setAudioNotes([]);
    setSelectedNote(null);
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-950 text-gray-200 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-fire-primary mb-2">Speech-to-Text Demo</h1>
        <p className="text-gray-400 mb-4">
          Test the free speech-to-text functionality for incident reporting. 
          Try saying phrases like "Engine 12 arrived at scene", "Captain Smith deployed ladder truck", 
          or "Observed heavy smoke from second floor".
        </p>
        
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-blue-900/30 border border-blue-700 rounded-md p-3">
            <h3 className="text-blue-300 text-sm font-medium mb-1">Browser Support</h3>
            <p className="text-blue-200 text-xs">
              Uses Web Speech API (Chrome, Edge, Safari). Falls back gracefully on unsupported browsers.
            </p>
          </div>
          <div className="flex-1 bg-green-900/30 border border-green-700 rounded-md p-3">
            <h3 className="text-green-300 text-sm font-medium mb-1">Free & Privacy-Focused</h3>
            <p className="text-green-200 text-xs">
              All processing happens in your browser. No external API calls or data transmission.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Section */}
        <div className="space-y-4">
          <SmartAudioRecorder 
            onRecordingComplete={handleAudioRecordingComplete}
            onTranscriptUpdate={handleTranscriptUpdate}
          />
          
          {audioNotes.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Recorded Notes ({audioNotes.length})</h3>
                <button
                  onClick={clearAllNotes}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-2">
                {audioNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      selectedNote?.id === note.id 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">
                        {formatTimestamp(note.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        {note.transcript ? (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Transcribed
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-400">Processing...</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {Math.round(note.blob.size / 1024)}KB
                        </span>
                      </div>
                    </div>
                    
                    {note.transcript && (
                      <p className="text-sm text-gray-200 line-clamp-2">
                        "{note.transcript.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Section */}
        <div className="space-y-4">
          {selectedNote ? (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
              
              {selectedNote.transcript ? (
                <div className="space-y-4">
                  {/* Full Transcript */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Full Transcript:</h4>
                    <div className="bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                      <p className="text-sm text-gray-200">{selectedNote.transcript}</p>
                    </div>
                  </div>

                  {/* Analysis Details */}
                  {selectedNote.analysis && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                          Confidence Score: 
                          <span className={`ml-2 ${
                            selectedNote.analysis.confidence > 0.7 ? 'text-green-400' :
                            selectedNote.analysis.confidence > 0.4 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(selectedNote.analysis.confidence * 100)}%
                          </span>
                        </h4>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Summary:</h4>
                        <p className="text-sm text-gray-200 bg-gray-800 p-2 rounded">
                          {selectedNote.analysis.summary}
                        </p>
                      </div>

                      {/* Extracted Details */}
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(selectedNote.analysis.incidentDetails).map(([key, values]) => {
                          if (!values || (Array.isArray(values) && values.length === 0)) return null;
                          
                          return (
                            <div key={key} className="bg-gray-800 p-3 rounded">
                              <h5 className="text-xs font-medium text-gray-400 uppercase mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h5>
                              <div className="text-sm text-gray-200">
                                {Array.isArray(values) ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {values.map((value, index) => (
                                      <li key={index}>{value}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>{values}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Keywords */}
                      {selectedNote.analysis.keywords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Keywords:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedNote.analysis.keywords.map((keyword, index) => (
                              <span 
                                key={index}
                                className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Waiting for transcription to complete...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-center py-8 text-gray-500">
                <p>Select a recording to view analysis results</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sample Phrases */}
      <div className="mt-8 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Sample Phrases to Try</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Personnel & Equipment:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• "Engine 12 and Truck 5 arrived on scene"</li>
              <li>• "Captain Johnson deployed the ladder truck"</li>
              <li>• "Firefighter Smith connected the supply line"</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Observations & Actions:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• "Heavy smoke observed from second floor windows"</li>
              <li>• "Advanced attack line through front entrance"</li>
              <li>• "Conducted primary search of first floor"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
