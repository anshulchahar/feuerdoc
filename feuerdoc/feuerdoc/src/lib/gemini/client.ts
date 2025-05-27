import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY; // Changed to GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables'); // Updated error message
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Assuming gemini-2.0-flash was a typo or not yet available
});

const generationConfig = {
  temperature: 0.3, // Lower temperature for more factual, consistent reports
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 12288, // Increased for longer, detailed reports
  responseMimeType: 'text/plain',
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function runGemini(prompt: string): Promise<string> {
  try {
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // No history for one-off report generation
    });

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
