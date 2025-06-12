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
    <div className="bg-black dark:bg-black border border-gray-800 dark:border-gray-800 px-6 py-3 rounded-full mb-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold text-white dark:text-white self-center mr-2">
            Quick filters:
          </span>
          {statusButtons.map((button) => (
            <button
              key={button.value}
              onClick={() => onStatusFilter(button.value)}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
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
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-white hover:text-gray-200 dark:text-white dark:hover:text-gray-200 transition-all duration-200 flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-800 dark:hover:bg-gray-800 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
          
          <div className="text-xs font-medium text-white dark:text-white bg-gray-800 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-700 dark:border-gray-700">
            {filteredCases} / {totalCases} cases
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
