# Speech-to-Text Implementation for Fire Incident Reporting

This implementation provides free, browser-based speech-to-text functionality for processing audio inputs in fire incident reports. The system automatically extracts relevant incident details, observations, and actions taken from audio recordings.

## Features

### 🎤 Smart Audio Recording
- **Web Speech API Integration**: Uses browser's built-in speech recognition (Chrome, Edge, Safari)
- **Real-time Transcription**: Optional live transcription during recording
- **Fallback Support**: Graceful degradation for unsupported browsers
- **Audio Playback**: Review recorded audio with built-in player

### 🧠 Intelligent Analysis
- **Incident Detail Extraction**: Automatically identifies:
  - Personnel and equipment mentioned
  - Actions taken during incident response
  - Time references and chronology
  - Hazards and safety concerns
  - Observations and witness statements
  - Weather conditions
  - Damage assessments

### 🔒 Privacy-Focused
- **No External APIs**: All processing happens in the browser
- **No Data Transmission**: Audio and transcripts stay on your device
- **Free to Use**: No API keys or subscription fees required

## How It Works

### 1. Audio Recording
The `SmartAudioRecorder` component provides:
- Start/stop recording controls
- Real-time transcription preview
- Audio playback functionality
- Status indicators for transcription progress

### 2. Speech Recognition
Uses the Web Speech API with:
- Automatic language detection (defaults to English)
- Confidence scoring for transcription quality
- Error handling and retry mechanisms
- Support for continuous speech recognition

### 3. Transcript Analysis
The `TranscriptAnalysisService` processes transcripts to extract:
```typescript
interface IncidentDetails {
  personnel?: string[];      // "Captain Smith", "Engine 12 crew"
  equipment?: string[];      // "ladder truck", "1¾ inch hose"
  actions?: string[];        // "advanced", "deployed", "ventilated"
  observations?: string[];   // "heavy smoke visible"
  timeReferences?: string[]; // "10:30 AM", "upon arrival"
  hazards?: string[];        // "electrical", "structural collapse"
  witnesses?: string[];      // witness statements
  damages?: string[];        // "roof damage", "smoke damage"
  weatherConditions?: string[]; // "high winds", "clear weather"
}
```

## Usage

### Basic Implementation
```tsx
import { SmartAudioRecorder } from '@/components/audio/SmartAudioRecorder';

function IncidentForm() {
  const handleAudioComplete = (audioBlob: Blob, transcript?: string) => {
    // Process the audio and transcript
    console.log('Audio recorded:', audioBlob);
    console.log('Transcript:', transcript);
  };

  return (
    <SmartAudioRecorder 
      onRecordingComplete={handleAudioComplete}
      onTranscriptUpdate={(id, transcript) => {
        // Handle real-time transcript updates
      }}
    />
  );
}
```

### Advanced Analysis
```tsx
import { transcriptAnalysisService } from '@/lib/speech-to-text/analysis';

const analysis = transcriptAnalysisService.analyzeTranscript(transcript);
console.log('Extracted details:', analysis.incidentDetails);
console.log('Confidence score:', analysis.confidence);
console.log('Summary:', analysis.summary);
```

## Browser Support

| Browser | Speech Recognition | Real-time | Notes |
|---------|-------------------|-----------|-------|
| Chrome | ✅ Full support | ✅ Yes | Best performance |
| Edge | ✅ Full support | ✅ Yes | Based on Chromium |
| Safari | ✅ Partial support | ⚠️ Limited | iOS 14.5+ required |
| Firefox | ❌ No support | ❌ No | Falls back to placeholder |

## Sample Test Phrases

Try these phrases to test the incident detail extraction:

### Personnel & Equipment
- "Engine 12 and Truck 5 arrived on scene"
- "Captain Johnson deployed the ladder truck"
- "Firefighter Smith connected the supply line"

### Actions & Observations
- "Advanced attack line through front entrance" 
- "Conducted primary search of first floor"
- "Heavy smoke observed from second floor windows"
- "Ventilated roof using chainsaw"

### Time & Location References
- "Arrived on scene at 10:30 AM"
- "Upon arrival observed active fire"
- "At approximately 11 hundred hours"

## Testing

Visit `/speech-test` to access the interactive demo that showcases:
- Real-time speech recognition
- Incident detail extraction
- Analysis confidence scoring
- Keyword identification

## Technical Details

### Components
- `SmartAudioRecorder`: Main recording interface
- `SpeechToTextService`: Core speech recognition logic
- `TranscriptAnalysisService`: Incident detail extraction
- `SpeechToTextDemo`: Testing and demonstration interface

### Key Technologies
- Web Speech API (`SpeechRecognition`)
- MediaRecorder API for audio capture
- Regular expressions for pattern matching
- React hooks for state management

### Performance Considerations
- Minimal CPU usage (browser-native processing)
- No network requests during transcription
- Memory-efficient audio blob handling
- Automatic cleanup of audio resources

## Future Enhancements

Potential improvements for production deployment:
- Integration with cloud speech APIs for better accuracy
- Support for multiple languages
- Audio quality enhancement filters
- Batch processing for multiple recordings
- Export functionality for transcripts and analysis
