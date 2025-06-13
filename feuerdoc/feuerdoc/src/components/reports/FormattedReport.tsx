'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface FormattedReportProps {
  content: string;
}

/**
 * A component that renders Markdown-formatted report content with proper styling
 */
export const FormattedReport: React.FC<FormattedReportProps> = ({ content }) => {
  const { theme } = useTheme();
  
  // Format Markdown to HTML with styling
  const formattedContent = content
    // Format headers
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 pb-1 border-b">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>')
    
    // Format lists - group list items
    .replace(/(?:^|\n)((?:[\-\*]\s+.*(?:\n|$))+)/g, (match, p1) => {
      const listItems = p1.trim()
        .split('\n')
        .filter((line: string) => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        .map((line: string) => `<li class="ml-5 pl-1">${line.trim().substring(2)}</li>`)
        .join('');
      return `<ul class="my-4">${listItems}</ul>`;
    })
    
    // Format paragraphs
    .replace(/(?:^|\n)([^<\n].+?)(?:\n{2,}|$)/g, '<p class="mb-4">$1</p>')
    
    // Clean up extra tags from the list processing
    .replace(/<\/ul>\s*<p class="mb-4"><ul class="my-4">/g, '')
    
    // Bold and italic text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Handle any remaining line breaks
    .replace(/\n/g, '<br />');
  
  return (
    <div 
      className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    ></div>
  );
};

export default FormattedReport;
