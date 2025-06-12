'use client';

import React from 'react';
import { Case } from '@/types';
import Link from 'next/link';

interface CaseListViewProps {
  caseData: Case;
  onInfoClick: () => void;
  onEditClick: () => void;
}

const CaseListView: React.FC<CaseListViewProps> = ({ caseData, onInfoClick, onEditClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="glass-card p-4 rounded-lg border hover:border-fire-primary transition-all duration-300 ease-in-out shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-fire-primary mb-1 truncate" title={caseData.title}>
                {caseData.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {caseData.location}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v2a1 1 0 01-1 1h-.5M8 7H3a1 1 0 00-1 1v2a1 1 0 001 1h.5M8 7v8a1 1 0 001 1h6a1 1 0 001-1V7" />
                  </svg>
                  Created: {new Date(caseData.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Updated: {new Date(caseData.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}>
              {caseData.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 shadow-sm hover:shadow-md"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Edit Button */}
          <Link href={`/cases/${caseData.id}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
              className="p-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200 shadow-sm hover:shadow-md"
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

export default CaseListView;
