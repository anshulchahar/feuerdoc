'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import { useRouter } from 'next/navigation'; // For potential redirect after creation
import { useTheme } from '@/contexts/ThemeContext';

interface CreateCaseFormProps {
  onCaseCreated: (newCase: Case) => void;
  onClose: () => void;
}

const CreateCaseForm: React.FC<CreateCaseFormProps> = ({ onCaseCreated, onClose }) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [initialReportFile, setInitialReportFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setInitialReportFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    if (!title || !location || !initialReportFile) {
      setError('All fields are required, including the initial report file.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Upload the initial report to Supabase Storage
      const fileExt = initialReportFile!.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `initial_reports/${fileName}`; // Dynamic filePath based on uploaded file

      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, initialReportFile!);

      if (uploadError) {
        // If storage upload fails, don't proceed to DB insert
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      // 2. Set a generic user ID for public access
      const userId = '00000000-0000-0000-0000-000000000000'; // Nil UUID for public access

      // 3. Create the case record in the database
      const newCaseData = {
        title,
        location,
        initial_report_path: filePath, // Corrected to snake_case
        status: 'Open' as const, // Type assertion
        user_id: userId, // Corrected to snake_case
        // Supabase will add id, createdAt, updatedAt automatically
      };

      const { data: newCase, error: insertError } = await supabase
        .from('cases')
        .insert(newCaseData)
        .select()
        .single();

      if (insertError) {
        // Attempt to delete the uploaded file if DB insert fails
        await supabase.storage.from('case-files').remove([filePath]);
        throw new Error(`Database Error: ${insertError.message}`);
      }

      if (newCase) {
        onCaseCreated(newCase as Case);
        setTitle('');
        setLocation('');
        setInitialReportFile(null);
        (document.getElementById('initialReportFile') as HTMLInputElement).value = '';
        onClose(); // Close the modal
        // Optionally, redirect or update UI
        // router.push(`/cases/${newCase.id}`);
      } else {
        throw new Error('Case creation failed, but no specific error was returned.');
      }

    } catch (err: any) {
      console.error('Error creating case:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 p-1 rounded-lg ${
      theme === 'light' ? 'text-gray-900 bg-white' : 'text-white bg-gray-800'
    }`}>
      {error && (
        <div className={`p-3 mb-4 text-sm rounded-lg shadow-md border ${
          theme === 'light' 
            ? 'text-gray-800 bg-gray-100 border-gray-300'
            : 'text-gray-200 bg-gray-800 border-gray-600'
        }`}>
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      <div>
        <label htmlFor="title" className={`block text-sm font-medium mb-1 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          Case Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-3 border rounded-md placeholder-gray-500 transition-colors duration-200 ${
            theme === 'light'
              ? 'border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
              : 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-white'
          }`}
          placeholder="e.g., Structure Fire at Elm Street"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="location" className={`block text-sm font-medium mb-1 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          Location / Address
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={`w-full p-3 border rounded-md placeholder-gray-500 transition-colors duration-200 ${
            theme === 'light'
              ? 'border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
              : 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-white'
          }`}
          placeholder="e.g., 123 Elm Street, Anytown"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="initialReportFile" className={`block text-sm font-medium mb-1 ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          Initial Contact Report (PDF, DOC, DOCX)
        </label>
        <input
          type="file"
          id="initialReportFile"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className={`w-full text-sm cursor-pointer focus:outline-none disabled:opacity-70 ${
            theme === 'light'
              ? 'file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-700 file:transition-colors file:duration-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-700'
              : 'file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 file:transition-colors file:duration-200 focus:ring-2 focus:ring-white focus:border-white text-gray-300'
          }`}
          required
          disabled={isLoading}
        />
        {initialReportFile && (
          <p className={`mt-2 text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>Selected: {initialReportFile.name}</p>
        )}
      </div>
      <div className="flex justify-end items-center space-x-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'light'
              ? 'text-gray-600 bg-gray-200 hover:bg-gray-300'
              : 'text-gray-400 bg-gray-600 hover:bg-gray-500'
          }`}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
            theme === 'light'
              ? 'text-white bg-gray-900 hover:bg-gray-700'
              : 'text-black bg-white hover:bg-gray-200'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Case'
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateCaseForm;
