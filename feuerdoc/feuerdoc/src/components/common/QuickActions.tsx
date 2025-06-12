'use client';

import React from 'react';
import { StatusFilter } from './SearchAndSort';

interface QuickActionsProps {
  onStatusFilter: (status: StatusFilter) => void;
  onClearFilters: () => void;
  totalCases: number;
  filteredCases: number;
  currentFilters: {
    search: string;
    status: StatusFilter;
  };
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onStatusFilter,
  onClearFilters,
  totalCases,
  filteredCases,
  currentFilters,
}) => {
  const hasActiveFilters = currentFilters.search || currentFilters.status !== 'all';

  const statusButtons: { label: string; value: StatusFilter; color: string }[] = [
    { label: 'All Cases', value: 'all', color: 'bg-gray-500 hover:bg-gray-600' },
    { label: 'Open', value: 'Open', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'In Progress', value: 'InProgress', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: 'Completed', value: 'Completed', color: 'bg-green-500 hover:bg-green-600' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl mb-6 shadow-sm backdrop-blur-sm force-light-mode light-mode-container !bg-white" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 self-center mr-3">
            Quick filters:
          </span>
          {statusButtons.map((button) => (
            <button
              key={button.value}
              onClick={() => onStatusFilter(button.value)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                currentFilters.status === button.value
                  ? button.color.replace('hover:', '') + ' shadow-md scale-105'
                  : button.color + ' hover:shadow-lg'
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-200 transition-all duration-200 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
          
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">
            {filteredCases} / {totalCases} cases
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
