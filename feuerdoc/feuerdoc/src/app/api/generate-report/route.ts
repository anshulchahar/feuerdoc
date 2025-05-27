import { NextResponse } from 'next/server';
import { runGemini } from '@/lib/gemini/client';
import { supabase } from '@/lib/supabase/client'; // Using client for simplicity, consider admin client for server-side

export async function POST(request: Request) {
  try {
    const { 
      caseId,
      caseTitle,
      caseLocation,
      initialReportPath,
      additionalNotes,
      audioTranscript 
    } = await request.json();

    if (!caseId || !caseTitle || !caseLocation || !initialReportPath) {
      return NextResponse.json({ error: 'Missing required case details for report generation.' }, { status: 400 });
    }

    // TODO: Fetch actual content of initialReportPath from Supabase Storage
    // This is a critical step. For now, we'll use a placeholder.
    // Example: const initialReportFileContent = await fetchInitialReport(initialReportPath);
    const initialReportFileContent = `[Content of initial report at ${initialReportPath} needs to be fetched and included here.]`;

    const prompt = `
      Fire Department Case Report Generation
      Case ID: ${caseId}
      Case Title: ${caseTitle}
      Case Location: ${caseLocation}
      
      Initial Report Summary:
      ${initialReportFileContent}
      
      Additional Field Notes (Text):
      ${additionalNotes || 'N/A'}
      
      Additional Field Notes (Audio Transcript):
      ${audioTranscript || 'N/A'}
      
      Based on all the information above, please generate a comprehensive final fire incident report.
      The report should be well-structured and professional.
      Include the following sections clearly marked (e.g., using Markdown headings like ## Section Title ##):
      1.  ## Incident Overview ## (Date, time, location, nature of incident, how it was reported)
      2.  ## Initial Response & Actions Taken ## (Units dispatched, arrival times, initial observations, sequence of firefighting/rescue operations)
      3.  ## Detailed Observations ## (Specifics about the fire spread, structural damage, hazards encountered, witness statements if any, conditions affecting operations)
      4.  ## Contributing Factors & Cause Determination ## (If determinable or suspected, based on evidence and observations. If under investigation, state so.)
      5.  ## Resources Used ## (Apparatus, equipment, personnel involved, mutual aid if any)
      6.  ## Conclusion & Outcome ## (Fire control time, property saved/lost, injuries/fatalities, current status of the scene)
      7.  ## Recommendations ## (If any, for property owner, further investigation, or operational improvements)
      
      Ensure the report is factual, clear, and concise. Use professional language suitable for official documentation.
    `;

    const generatedReport = await runGemini(prompt);

    // Optionally, immediately save the first version of the AI report to the database
    // This provides a baseline even if the user doesn't explicitly save later.
    const { error: updateError } = await supabase
      .from('cases')
      .update({ final_report_content: generatedReport, status: 'InProgress' }) // Corrected to snake_case
      .eq('id', caseId);

    if (updateError) {
      console.error('Error updating case with AI report:', updateError);
      // Don't fail the whole request, but log the error. The user still gets the report.
    }

    return NextResponse.json({ report: generatedReport });

  } catch (error: any) {
    console.error('Error in /api/generate-report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report via API.' }, 
      { status: 500 }
    );
  }
}

// Placeholder function for fetching initial report - IMPLEMENT THIS
// async function fetchInitialReport(filePath: string): Promise<string> {
//   // 1. Download the file from Supabase Storage
//   // const { data: fileData, error: downloadError } = await supabase.storage.from('case-files').download(filePath);
//   // if (downloadError) throw downloadError;
//   // if (!fileData) throw new Error('Failed to download initial report file.');
// 
//   // 2. Extract text content (this is complex and depends on file type - PDF, DOCX)
//   // For PDF, you might use a library like 'pdf-parse' (on the server)
//   // For DOCX, you might use 'mammoth' or similar
//   // This example assumes a plain text file for simplicity, which is unlikely for reports.
//   // return await fileData.text();
//   return "[Initial report content for " + filePath + " would be extracted and placed here. This is a placeholder.]";
// }
