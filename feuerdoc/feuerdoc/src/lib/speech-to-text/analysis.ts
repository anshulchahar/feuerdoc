// Service for analyzing audio transcripts and extracting incident details
// This service processes speech-to-text output to identify key incident information

export interface IncidentDetails {
  location?: string;
  personnel?: string[];
  equipment?: string[];
  actions?: string[];
  observations?: string[];
  timeReferences?: string[];
  hazards?: string[];
  witnesses?: string[];
  damages?: string[];
  weatherConditions?: string[];
}

export interface TranscriptAnalysis {
  incidentDetails: IncidentDetails;
  keywords: string[];
  confidence: number;
  summary: string;
}

export class TranscriptAnalysisService {
  private keywordPatterns = {
    personnel: /(?:officer|captain|lieutenant|firefighter|paramedic|chief|crew|team|personnel|member)s?\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/gi,
    equipment: /(?:truck|engine|ladder|hose|pump|tank|apparatus|vehicle|tool|gear|equipment)\s+([a-zA-Z0-9\s]+)/gi,
    actions: /(?:deployed|used|applied|started|stopped|arrived|left|evacuated|rescued|extinguished|controlled|contained|suppressed|ventilated|searched)/gi,
    timeReferences: /(?:at|around|approximately|about)\s+(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)/gi,
    hazards: /(?:smoke|fire|explosion|collapse|electrical|gas|chemical|hazmat|dangerous|unsafe|unstable)/gi,
    damages: /(?:damage|destroyed|burned|collapsed|broken|cracked|flooded|smoke damage)/gi,
    observations: /(?:observed|noticed|saw|found|discovered|detected|witnessed)/gi,
    weatherConditions: /(?:wind|rain|snow|fog|clear|cloudy|temperature|weather|sunny|stormy)/gi
  };

  private actionVerbs = [
    'arrived', 'deployed', 'established', 'connected', 'advanced', 'searched',
    'rescued', 'evacuated', 'extinguished', 'ventilated', 'overhaul', 'secured',
    'controlled', 'contained', 'suppressed', 'cooled', 'protected', 'removed'
  ];

  private emergencyTerms = [
    'fire', 'smoke', 'flames', 'explosion', 'collapse', 'injury', 'victim',
    'hazmat', 'leak', 'spill', 'emergency', 'alarm', 'dispatch', 'response'
  ];

  public analyzeTranscript(transcript: string): TranscriptAnalysis {
    const normalizedTranscript = transcript.toLowerCase();
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const incidentDetails: IncidentDetails = {
      personnel: this.extractPersonnel(transcript),
      equipment: this.extractEquipment(transcript),
      actions: this.extractActions(normalizedTranscript),
      observations: this.extractObservations(sentences),
      timeReferences: this.extractTimeReferences(transcript),
      hazards: this.extractHazards(normalizedTranscript),
      witnesses: this.extractWitnesses(transcript),
      damages: this.extractDamages(normalizedTranscript),
      weatherConditions: this.extractWeatherConditions(normalizedTranscript)
    };

    const keywords = this.extractKeywords(normalizedTranscript);
    const confidence = this.calculateConfidence(transcript, incidentDetails);
    const summary = this.generateSummary(incidentDetails, sentences);

    return {
      incidentDetails,
      keywords,
      confidence,
      summary
    };
  }

  private extractPersonnel(text: string): string[] {
    const personnel: Set<string> = new Set();
    const matches = text.matchAll(this.keywordPatterns.personnel);
    
    for (const match of matches) {
      if (match[1]) {
        personnel.add(match[1].trim());
      }
    }

    // Look for rank and name patterns
    const rankPatterns = [
      /(?:captain|capt\.?)\s+([a-zA-Z]+)/gi,
      /(?:lieutenant|lt\.?)\s+([a-zA-Z]+)/gi,
      /(?:chief)\s+([a-zA-Z]+)/gi,
      /(?:officer)\s+([a-zA-Z]+)/gi
    ];

    rankPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          personnel.add(match[0].trim());
        }
      }
    });

    return Array.from(personnel).filter(p => p.length > 1);
  }

  private extractEquipment(text: string): string[] {
    const equipment: Set<string> = new Set();
    const equipmentTerms = [
      'engine', 'truck', 'ladder', 'rescue', 'tanker', 'pump', 'hose',
      'nozzle', 'mask', 'scba', 'tool', 'axe', 'halligan', 'saw', 'extinguisher'
    ];

    equipmentTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(text)) {
        equipment.add(term);
      }
    });

    // Look for numbered equipment
    const numberedEquipment = text.matchAll(/(?:engine|truck|unit|rescue)\s+(\d+)/gi);
    for (const match of numberedEquipment) {
      equipment.add(match[0].trim());
    }

    return Array.from(equipment);
  }

  private extractActions(text: string): string[] {
    const actions: Set<string> = new Set();
    
    this.actionVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => actions.add(match));
      }
    });

    return Array.from(actions);
  }

  private extractObservations(sentences: string[]): string[] {
    const observations: string[] = [];
    const observationKeywords = ['observed', 'saw', 'noticed', 'found', 'discovered', 'detected'];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (observationKeywords.some(keyword => lowerSentence.includes(keyword))) {
        observations.push(sentence.trim());
      }
    });

    return observations;
  }

  private extractTimeReferences(text: string): string[] {
    const timeRefs: Set<string> = new Set();
    
    // Extract specific times
    const timeMatches = text.matchAll(/\b(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)\b/g);
    for (const match of timeMatches) {
      timeRefs.add(match[1]);
    }

    // Extract relative times
    const relativeTimePatterns = [
      /\b(upon arrival|on arrival|initially|first|then|next|later|finally)\b/gi,
      /\b(at \d{4} hours?|at \d{1,2}:\d{2})\b/gi
    ];

    relativeTimePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        timeRefs.add(match[1]);
      }
    });

    return Array.from(timeRefs);
  }

  private extractHazards(text: string): string[] {
    const hazards: Set<string> = new Set();
    const hazardTerms = [
      'smoke', 'fire', 'flames', 'explosion', 'collapse', 'electrical',
      'gas', 'chemical', 'hazmat', 'toxic', 'dangerous', 'unstable'
    ];

    hazardTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\w*\\b`, 'gi');
      if (regex.test(text)) {
        hazards.add(term);
      }
    });

    return Array.from(hazards);
  }

  private extractWitnesses(text: string): string[] {
    const witnesses: string[] = [];
    const witnessPatterns = [
      /witness(?:es)?\s+(?:stated|said|reported|indicated)/gi,
      /(?:bystander|civilian|resident|neighbor)\s+(?:stated|said|reported)/gi
    ];

    witnessPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        witnesses.push(match[0]);
      }
    });

    return witnesses;
  }

  private extractDamages(text: string): string[] {
    const damages: Set<string> = new Set();
    const damageTerms = [
      'damage', 'destroyed', 'burned', 'collapsed', 'broken', 'cracked',
      'flooded', 'smoke damage', 'water damage', 'structural damage'
    ];

    damageTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(text)) {
        damages.add(term);
      }
    });

    return Array.from(damages);
  }

  private extractWeatherConditions(text: string): string[] {
    const weather: Set<string> = new Set();
    const weatherTerms = [
      'wind', 'rain', 'snow', 'fog', 'clear', 'cloudy', 'sunny', 'stormy',
      'temperature', 'cold', 'hot', 'humid', 'dry'
    ];

    weatherTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\w*\\b`, 'gi');
      if (regex.test(text)) {
        weather.add(term);
      }
    });

    return Array.from(weather);
  }

  private extractKeywords(text: string): string[] {
    const keywords: Set<string> = new Set();
    
    // Add emergency terms
    this.emergencyTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.add(term);
      }
    });

    // Add action verbs found
    this.actionVerbs.forEach(verb => {
      if (text.includes(verb)) {
        keywords.add(verb);
      }
    });

    return Array.from(keywords);
  }

  private calculateConfidence(transcript: string, details: IncidentDetails): number {
    let score = 0;
    const maxScore = 10;

    // Check for presence of key information
    if (details.actions && details.actions.length > 0) score += 2;
    if (details.personnel && details.personnel.length > 0) score += 1;
    if (details.equipment && details.equipment.length > 0) score += 1;
    if (details.timeReferences && details.timeReferences.length > 0) score += 1;
    if (details.hazards && details.hazards.length > 0) score += 2;
    if (details.observations && details.observations.length > 0) score += 2;
    if (details.damages && details.damages.length > 0) score += 1;

    // Check transcript length and quality
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount > 50) score += 0.5;
    if (wordCount > 100) score += 0.5;

    return Math.min(score / maxScore, 1.0);
  }

  private generateSummary(details: IncidentDetails, sentences: string[]): string {
    const summaryParts: string[] = [];

    if (details.actions && details.actions.length > 0) {
      summaryParts.push(`Key actions: ${details.actions.slice(0, 3).join(', ')}`);
    }

    if (details.hazards && details.hazards.length > 0) {
      summaryParts.push(`Hazards identified: ${details.hazards.join(', ')}`);
    }

    if (details.equipment && details.equipment.length > 0) {
      summaryParts.push(`Equipment mentioned: ${details.equipment.slice(0, 3).join(', ')}`);
    }

    if (details.personnel && details.personnel.length > 0) {
      summaryParts.push(`Personnel: ${details.personnel.slice(0, 2).join(', ')}`);
    }

    if (summaryParts.length === 0) {
      summaryParts.push('General incident notes recorded');
    }

    return summaryParts.join('. ') + '.';
  }
}

export const transcriptAnalysisService = new TranscriptAnalysisService();
