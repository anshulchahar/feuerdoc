import React, { useState, useRef, useEffect } from 'react';
import { speechToTextService, fallbackService, SpeechRecognitionResult } from '@/lib/speech-to-text/service';

interface AudioRecording {
  id: string;
  blob: Blob;
  url: string;
  timestamp: Date;
  duration?: number;
  transcript?: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'error';
}

interface SmartAudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  onTranscriptUpdate?: (recordingId: string, transcript: string) => void;
}

export const SmartAudioRecorder: React.FC<SmartAudioRecorderProps> = ({ 
  onRecordingComplete,
  onTranscriptUpdate 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>('');
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentRecognition, setCurrentRecognition] = useState<MediaRecorder | null>(null);
  
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    setSpeechSupported(speechToTextService.isServiceSupported());
  }, []);

  const startRecording = async () => {
    try {
      // Stop any existing recognition before starting new one
      if (speechSupported && speechToTextService.isCurrentlyListening()) {
        speechToTextService.stopRecognition();
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for cleanup
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordingId = Date.now().toString();
        
        const newRecording: AudioRecording = {
          id: recordingId,
          blob: audioBlob,
          url: audioUrl,
          timestamp: new Date(),
          transcriptionStatus: 'pending'
        };
        
        setRecordings(prev => [...prev, newRecording]);
        onRecordingComplete(audioBlob);
        
        // Start transcription process if we're not in real-time mode
        if (!isRealTimeMode) {
          await transcribeRecording(recordingId, audioBlob);
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start real-time transcription if supported and enabled
      if (isRealTimeMode && speechSupported) {
        try {
          setRealTimeTranscript('');
          const recognitionRecorder = await speechToTextService.transcribeRealTime(
            { language: 'en-US', continuous: true, interimResults: true },
            (result: SpeechRecognitionResult) => {
              if (result.isFinal) {
                setRealTimeTranscript(prev => prev + result.transcript + ' ');
              }
            },
            (error: string) => {
              console.warn('Real-time transcription error:', error);
            }
          );
          setCurrentRecognition(recognitionRecorder);
        } catch (error) {
          console.warn('Failed to start real-time transcription:', error);
        }
      }
      
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
    
    // Stop speech recognition and clean up
    if (speechSupported) {
      speechToTextService.stopRecognition();
    }
    
    if (currentRecognition) {
      try {
        currentRecognition.stop();
      } catch (error) {
        console.warn('Error stopping recognition recorder:', error);
      }
      setCurrentRecognition(null);
    }
    
    // If we were in real-time mode, use the real-time transcript
    if (isRealTimeMode && realTimeTranscript.trim()) {
      // Find the most recent recording and add the real-time transcript
      setRecordings(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          const lastRecording = updated[updated.length - 1];
          lastRecording.transcript = realTimeTranscript.trim();
          lastRecording.transcriptionStatus = 'completed';
          
          // Notify parent component about the transcript
          if (onTranscriptUpdate) {
            onTranscriptUpdate(lastRecording.id, realTimeTranscript.trim());
          }
        }
        return updated;
      });
    }
  };

  const transcribeRecording = async (recordingId: string, audioBlob: Blob) => {
    // Don't transcribe if we already have a transcript from real-time mode
    const recording = recordings.find(r => r.id === recordingId);
    if (recording?.transcript) {
      return;
    }

    // Update status to processing
    setRecordings(prev => prev.map(r => 
      r.id === recordingId 
        ? { ...r, transcriptionStatus: 'processing' }
        : r
    ));

    try {
      let transcript = '';
      
      if (speechSupported && !speechToTextService.isCurrentlyListening()) {
        // Use the new direct transcription method for recorded audio
        transcript = await speechToTextService.transcribeAudio(audioBlob, {
          language: 'en-US',
          continuous: false,
          interimResults: false
        });
      } else {
        transcript = await fallbackService.transcribeAudio(audioBlob);
      }

      // Update recording with transcript
      setRecordings(prev => prev.map(r => 
        r.id === recordingId 
          ? { 
              ...r, 
              transcript, 
              transcriptionStatus: 'completed'
            }
          : r
      ));

      // Notify parent component
      if (onTranscriptUpdate) {
        onTranscriptUpdate(recordingId, transcript);
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setRecordings(prev => prev.map(r => 
        r.id === recordingId 
          ? { 
              ...r, 
              transcript: `Error: ${error instanceof Error ? error.message : 'Failed to transcribe'}`,
              transcriptionStatus: 'error'
            }
          : r
      ));
    }
  };

  const retryTranscription = async (recordingId: string) => {
    const recording = recordings.find(r => r.id === recordingId);
    if (recording) {
      await transcribeRecording(recordingId, recording.blob);
    }
  };

  const playAudio = (recording: AudioRecording) => {
    // Stop any currently playing audio
    if (currentlyPlaying) {
      const currentAudio = audioElementsRef.current.get(currentlyPlaying);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Create or get audio element for this recording
    let audio = audioElementsRef.current.get(recording.id);
    if (!audio) {
      audio = new Audio(recording.url);
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });
      audio.addEventListener('loadedmetadata', () => {
        setRecordings(prev => prev.map(r => 
          r.id === recording.id 
            ? { ...r, duration: audio?.duration } 
            : r
        ));
      });
      audioElementsRef.current.set(recording.id, audio);
    }

    audio.play();
    setCurrentlyPlaying(recording.id);
  };

  const pauseAudio = (recordingId: string) => {
    const audio = audioElementsRef.current.get(recordingId);
    if (audio) {
      audio.pause();
      setCurrentlyPlaying(null);
    }
  };

  const deleteRecording = (recordingId: string) => {
    const audio = audioElementsRef.current.get(recordingId);
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    
    const recording = recordings.find(r => r.id === recordingId);
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    audioElementsRef.current.delete(recordingId);
    
    if (currentlyPlaying === recordingId) {
      setCurrentlyPlaying(null);
    }
  };

  const formatDuration = (duration: number | undefined): string => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: AudioRecording['transcriptionStatus']) => {
    switch (status) {
      case 'processing':
        return (
          <svg className="animate-spin w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="my-4 p-4 border border-gray-800 rounded-lg bg-gray-950">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-200">Smart Audio Notes</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {speechSupported ? 'Speech-to-text enabled' : 'Speech-to-text unavailable'}
          </span>
          {speechSupported && (
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={isRealTimeMode}
                onChange={(e) => setIsRealTimeMode(e.target.checked)}
                className="w-3 h-3"
              />
              Real-time
            </label>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mb-3">
        Record audio notes with automatic speech-to-text transcription. 
        {speechSupported 
          ? ' Speech recognition will extract incident details automatically.' 
          : ' Browser-based speech recognition is not available.'
        }
      </p>

      {/* Real-time transcript display */}
      {isRealTimeMode && isRecording && realTimeTranscript && (
        <div className="mb-3 p-2 bg-blue-900/30 border border-blue-700 rounded-md">
          <div className="text-xs text-blue-300 mb-1">Real-time transcript:</div>
          <div className="text-sm text-blue-200">{realTimeTranscript}</div>
        </div>
      )}
      
      {/* Recording Controls */}
      <div className="mb-4">
        {!isRecording ? (
          <button 
            onClick={startRecording} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Recording
          </button>
        )}
      </div>

      {/* Recorded Audio List */}
      {recordings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-md font-medium text-gray-300 border-b border-gray-700 pb-2">
            Recorded Audio ({recordings.length})
          </h4>
          {recordings.map((recording) => (
            <div key={recording.id} className="bg-gray-900 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => 
                      currentlyPlaying === recording.id 
                        ? pauseAudio(recording.id) 
                        : playAudio(recording)
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                  >
                    {currentlyPlaying === recording.id ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">
                        Recording {formatTimestamp(recording.timestamp)}
                      </span>
                      {getStatusIcon(recording.transcriptionStatus)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Duration: {formatDuration(recording.duration)} • 
                      Size: {Math.round(recording.blob.size / 1024)} KB
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {recording.transcriptionStatus === 'error' && (
                    <button
                      onClick={() => retryTranscription(recording.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md transition-colors"
                      title="Retry transcription"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteRecording(recording.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors"
                    title="Delete recording"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 9.586 7.707 7.293a1 1 0 00-1.414 1.414L8.586 11l-2.293 2.293a1 1 0 101.414 1.414L10 12.414l2.293 2.293a1 1 0 001.414-1.414L11.414 11l2.293-2.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Transcript Display */}
              {recording.transcript && (
                <div className="mt-2 p-2 bg-gray-800 rounded border-l-4 border-blue-500">
                  <div className="text-xs text-gray-400 mb-1">Transcript:</div>
                  <div className="text-sm text-gray-200">{recording.transcript}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
