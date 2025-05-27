'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Case } from '@/types';
import { useRouter } from 'next/navigation'; // For potential redirect after creation

interface CreateCaseFormProps {
  onCaseCreated: (newCase: Case) => void;
  onClose: () => void;
}

const CreateCaseForm: React.FC<CreateCaseFormProps> = ({ onCaseCreated, onClose }) => {
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
      const fileExt = initialReportFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `initial_reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-files') // Make sure this bucket exists and has correct policies
        .upload(filePath, initialReportFile);

      if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      // 2. Get user ID (assuming user is authenticated - implement auth later)
      // For now, let's use a placeholder or handle anonymous if your RLS allows
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous-user'; // Replace with actual user ID

      // 3. Create the case record in the database
      const newCaseData = {
        title,
        location,
        initialReportPath: filePath,
        status: 'Open' as const, // Type assertion
        userId: userId,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 bg-red-900 p-3 rounded-md">{error}</p>}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Case Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-fire-primary focus:border-fire-primary"
          required
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-fire-primary focus:border-fire-primary"
          required
        />
      </div>
      <div>
        <label htmlFor="initialReportFile" className="block text-sm font-medium text-gray-300 mb-1">
          Initial Contact Report (PDF/DOCX)
        </label>
        <input
          type="file"
          id="initialReportFile"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-fire-primary file:text-white hover:file:bg-fire-secondary"
          required
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-fire-primary hover:bg-fire-secondary rounded-md disabled:opacity-50 shadow-fire"
        >
          {isLoading ? 'Creating...' : 'Create Case'}
        </button>
      </div>
    </form>
  );
};

export default CreateCaseForm;
