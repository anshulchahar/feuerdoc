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
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 truncate" title={caseData.title} style={{color: '#000000'}}>{caseData.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate" title={caseData.location}>Location: {caseData.location}</p>
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${caseData.status === 'Open' ? 'bg-blue-500 text-white' : caseData.status === 'InProgress' ? 'bg-yellow-500 text-black' : caseData.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {caseData.status}
        </span>
        <div className="flex gap-2">
          {/* Info icon for modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="p-1.5 rounded-full bg-gray-900 hover:bg-gray-700 text-white transition-colors duration-200"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          {/* Edit/pencil icon for navigation */}
          <Link href={`/cases/${caseData.id}`}>
            <button
              className="p-1.5 rounded-full bg-gray-900 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black transition-colors duration-200"
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
