'use client';

import React from 'react';
import { Case } from '@/types';
import Link from 'next/link';

interface CaseCardProps {
  caseData: Case;
  onInfoClick: () => void;
  onEditClick: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, onInfoClick, onEditClick }) => {
  return (
    <div
      className="glass-card p-5 rounded-xl border hover:border-gray-900 dark:hover:border-white transition-all duration-300 ease-in-out transform hover:-translate-y-1 relative"
    >
      <div className="flex flex-col gap-3">
        {/* Header with title and status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate flex-1" title={caseData.title} style={{color: '#000000'}}>{caseData.title}</h3>
          <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${caseData.status === 'Open' ? 'bg-blue-500 text-white' : caseData.status === 'InProgress' ? 'bg-yellow-500 text-black' : caseData.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
            {caseData.status}
          </span>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={caseData.location}>{caseData.location}</p>
        </div>
        
        {/* Created date */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v2a1 1 0 01-1 1h-.5M8 7H3a1 1 0 00-1 1v2a1 1 0 001 1h.5M8 7v8a1 1 0 001 1h6a1 1 0 001-1V7" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(caseData.created_at).toLocaleDateString()}</p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Info icon for modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="p-2 rounded-full bg-black hover:bg-gray-800 text-white transition-colors duration-200"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          {/* Edit/pencil icon for navigation */}
          <Link href={`/cases/${caseData.id}`}>
            <button
              className="p-2 rounded-full bg-black hover:bg-gray-800 text-white transition-colors duration-200"
              title="Edit Case"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;
