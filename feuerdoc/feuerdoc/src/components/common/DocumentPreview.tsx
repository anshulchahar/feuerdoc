'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

interface DocumentPreviewProps {
  filePath: string;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ 
  filePath, 
  fileName, 
  isOpen, 
  onClose 
}) => {
  const { theme } = useTheme();
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && filePath) {
      loadFile();
    }
  }, [isOpen, filePath]);

  const loadFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get the public URL for the file
      const { data } = supabase.storage
        .from('case-files')
        .getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setFileUrl(data.publicUrl);
        
        // Determine file type from extension
        const extension = filePath.toLowerCase().split('.').pop() || '';
        setFileType(extension);
      } else {
        setError('Could not load file preview');
      }
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            theme === 'light' ? 'border-gray-900' : 'border-white'
          }`}></div>
          <span className={`ml-3 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>Loading preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={`mb-4 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>{error}</p>
          <button
            onClick={handleDownload}
            className={`px-4 py-2 rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-gray-900 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-200 text-black'
            }`}
          >
            Download Document
          </button>
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="h-[80vh] w-full">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0 rounded-md"
            title="PDF Preview"
          />
        </div>
      );
    }

    // For DOC/DOCX files, we'll show a preview using Google Docs Viewer
    if (fileType === 'doc' || fileType === 'docx') {
      return (
        <div className="h-[80vh] w-full">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-full border-0 rounded-md"
            title="Document Preview"
          />
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className={`mb-4 ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Preview not available for this file type (.{fileType})
        </p>
        <button
          onClick={handleDownload}
          className={`px-4 py-2 rounded-md transition-colors ${
            theme === 'light'
              ? 'bg-gray-900 hover:bg-gray-700 text-white'
              : 'bg-white hover:bg-gray-200 text-black'
          }`}
        >
          Download Document
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30 backdrop-blur-sm">
      <div className={`rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden ${
        theme === 'light' 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <div className="flex items-center">
            <svg className={`w-6 h-6 mr-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className={`text-lg font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            }`}>
              Document Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className={`p-2 rounded-md transition-colors ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Download Document"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-md transition-colors ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Close Preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* File Info */}
        {fileName && (
          <div className={`px-4 py-2 border-b ${
            theme === 'light' 
              ? 'bg-gray-50 border-gray-200' 
              : 'bg-gray-900 border-gray-700'
          }`}>
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <span className="font-medium">File:</span> {fileName}
              <span className="ml-4 font-medium">Type:</span> {fileType.toUpperCase()}
            </p>
          </div>
        )}

        {/* Preview Content */}
        <div className="overflow-auto">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${
          theme === 'light' 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-700 bg-gray-900'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-500'
            }`}>
              Initial reports are read-only. Use the field notes section to add additional information.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                  theme === 'light'
                    ? 'bg-gray-900 hover:bg-gray-700 text-white'
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
