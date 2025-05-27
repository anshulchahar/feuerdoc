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

    // Fetch actual content of initialReportPath from Supabase Storage
    let initialReportFileContent = '';
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('case-files')
        .download(initialReportPath);
      
      if (downloadError) {
        console.error('Error downloading initial report:', downloadError);
        initialReportFileContent = `[Unable to access initial report file at ${initialReportPath}. Error: ${downloadError.message}. Please ensure the file exists and is accessible.]`;
      } else if (fileData) {
        // Handle different file types
        const fileName = initialReportPath.toLowerCase();
        
        if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
          // Plain text files
          initialReportFileContent = await fileData.text();
        } else if (fileName.endsWith('.pdf')) {
          // TODO: Implement PDF parsing using pdf-parse or similar
          initialReportFileContent = `[PDF file detected at ${initialReportPath}. PDF content extraction is not yet implemented. Please ensure initial report information is included in the additional field notes for now.]`;
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // TODO: Implement Word document parsing using mammoth or similar
          initialReportFileContent = `[Word document detected at ${initialReportPath}. Document content extraction is not yet implemented. Please ensure initial report information is included in the additional field notes for now.]`;
        } else {
          // Try to read as text for other file types
          try {
            initialReportFileContent = await fileData.text();
          } catch (textError) {
            initialReportFileContent = `[File type not supported for automatic content extraction: ${fileName}. Please ensure initial report information is included in the additional field notes.]`;
          }
        }
      } else {
        initialReportFileContent = `[Initial report file at ${initialReportPath} could not be retrieved from storage]`;
      }
    } catch (fileError) {
      console.error('Error processing initial report file:', fileError);
      initialReportFileContent = `[Error processing initial report file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}. Please include initial report details in additional field notes.]`;
    }

    const prompt = `
      You are an expert fire department report writer. Generate a comprehensive final fire incident report based on the provided information.
      
      CASE INFORMATION:
      Case ID: ${caseId}
      Case Title: ${caseTitle}
      Case Location: ${caseLocation}
      
      INITIAL REPORT CONTENT:
      ${initialReportFileContent}
      
      ADDITIONAL FIELD NOTES (TEXT):
      ${additionalNotes || 'No additional text notes provided.'}
      
      ADDITIONAL FIELD NOTES (AUDIO TRANSCRIPT):
      ${audioTranscript || 'No audio notes recorded.'}
      
      INSTRUCTIONS:
      Generate a professional fire department incident report following this structure. Extract all relevant details from the initial report and additional notes. Be specific with times, locations, personnel, equipment, and actions. Use professional fire department terminology.

      Please format the report with clear sections using markdown headers:

      ## Final Fire Incident Report: [Title]

      ### Incident Overview
      - Date and time of incident
      - Location details
      - How the incident was reported (911 call, alarm system, etc.)
      - Initial nature of the emergency
      - Weather conditions if relevant

      ### Initial Response & Actions Taken
      - Units dispatched and personnel involved
      - Arrival times and initial observations
      - Sequence of firefighting/rescue operations
      - Equipment deployed (engines, ladders, SCBA, etc.)
      - Command structure and decision-making

      ### Detailed Observations
      - Fire spread patterns and behavior
      - Structural damage assessment
      - Hazards encountered during operations
      - Witness statements or resident interactions
      - Environmental factors affecting operations
      - Use of specialized equipment (TIC, PPV fans, etc.)

      ### Contributing Factors & Cause Determination
      - Suspected or determined cause of the fire
      - Contributing factors (electrical, structural, environmental)
      - Evidence observed at the scene
      - Need for further investigation

      ### Resources Used
      - Apparatus and equipment utilized
      - Personnel count and roles
      - Mutual aid if applicable
      - Duration of operations

      ### Conclusion & Outcome
      - Time fire was declared under control
      - Property saved vs. damaged
      - Injuries or fatalities
      - Estimated damage costs
      - Current status of the scene

      ### Recommendations
      - Safety recommendations for property owner
      - Follow-up actions required
      - Lessons learned or operational improvements
      - Referrals to other agencies if needed

      Extract specific details from the provided reports and notes. If information is not available for a section, indicate that clearly rather than making assumptions. Use precise timestamps, measurements, and technical details when available.
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
