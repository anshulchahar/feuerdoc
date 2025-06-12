// Free Speech-to-Text Service using Web Speech API
// This service provides browser-based speech recognition capabilities

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechToTextService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private currentStream: MediaStream | null = null;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    // Check for Web Speech API support (only in browser)
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
    }
  }

  public isServiceSupported(): boolean {
    return this.isSupported;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public async transcribeAudio(
    audioBlob: Blob,
    options: SpeechToTextOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      // If already listening, reject to prevent conflicts
      if (this.isListening) {
        reject(new Error('Speech recognition is already in progress'));
        return;
      }

      try {
        // Create a new recognition instance for this transcription
        const recognition = this.createNewRecognition();
        
        // Configure speech recognition
        recognition.lang = options.language || 'en-US';
        recognition.continuous = options.continuous || false;
        recognition.interimResults = options.interimResults || false;
        recognition.maxAlternatives = options.maxAlternatives || 1;

        let finalTranscript = '';
        this.isListening = true;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' ';
            }
          }
        };

        recognition.onend = () => {
          this.isListening = false;
          resolve(finalTranscript.trim() || 'No speech detected');
        };

        recognition.onerror = (event: any) => {
          this.isListening = false;
          reject(new Error(`Speech recognition error: ${event.error}`));
        };

        // Start recognition directly (no need to play audio for live microphone)
        recognition.start();

        // Set a timeout to automatically stop recognition after 30 seconds
        setTimeout(() => {
          if (this.isListening) {
            recognition.stop();
          }
        }, 30000);

      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  public async transcribeRealTime(
    options: SpeechToTextOptions = {},
    onResult?: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<MediaRecorder> {
    return new Promise(async (resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      // Stop any existing recognition first
      if (this.isListening) {
        this.stopRecognition();
        // Wait a bit for the previous session to fully stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.currentStream = stream;
        
        // Create a new recognition instance for real-time
        const recognition = this.createNewRecognition();
        
        // Configure speech recognition for real-time
        recognition.lang = options.language || 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = options.maxAlternatives || 1;

        this.isListening = true;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const resultData: SpeechRecognitionResult = {
              transcript: result[0].transcript,
              confidence: result[0].confidence || 0,
              isFinal: result.isFinal
            };
            
            if (onResult) {
              onResult(resultData);
            }
          }
        };

        recognition.onend = () => {
          this.isListening = false;
          if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
          }
        };

        recognition.onerror = (event: any) => {
          const errorMessage = `Speech recognition error: ${event.error}`;
          console.error(errorMessage);
          this.isListening = false;
          if (onError) {
            onError(errorMessage);
          }
          if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
          }
        };

        // Create MediaRecorder for audio capture
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
          }
        };

        // Start recognition first, then recorder
        recognition.start();
        mediaRecorder.start();

        // Store reference to this recognition instance
        this.recognition = recognition;

        resolve(mediaRecorder);

      } catch (error) {
        this.isListening = false;
        if (this.currentStream) {
          this.currentStream.getTracks().forEach(track => track.stop());
          this.currentStream = null;
        }
        reject(error);
      }
    });
  }

  public stopRecognition(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    }
    
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    this.isListening = false;
  }

  private createNewRecognition(): any {
    if (typeof window === 'undefined') {
      throw new Error('Speech recognition not available on server');
    }
    
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      return new SpeechRecognition();
    }
    
    throw new Error('Speech recognition not supported');
  }
}

// Fallback service for when Web Speech API is not available
export class FallbackSpeechToTextService {
  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    // For demonstration purposes, we'll return a placeholder
    // In a real application, you could integrate with a free API like:
    // - Google Cloud Speech-to-Text (free tier)
    // - Assembly AI (free tier)
    // - Or implement a local solution like OpenAI Whisper (self-hosted)
    
    const audioSize = Math.round(audioBlob.size / 1024);
    const duration = await this.getAudioDuration(audioBlob);
    
    return `[Audio transcription placeholder - ${duration}s recording, ${audioSize}KB. In production, this would be processed by a speech-to-text service to extract incident details, observations, and actions taken.]`;
  }

  private getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = URL.createObjectURL(audioBlob);
    });
  }
}

// Export the main service instance
export const speechToTextService = new SpeechToTextService();
export const fallbackService = new FallbackSpeechToTextService();
