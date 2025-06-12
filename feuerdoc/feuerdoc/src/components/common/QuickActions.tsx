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
    <div className="glass-card p-4 rounded-lg mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Quick Status Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center mr-2">
            Quick filters:
          </span>
          {statusButtons.map((button) => (
            <button
              key={button.value}
              onClick={() => onStatusFilter(button.value)}
              className={`px-3 py-1 text-xs font-medium text-white rounded-full transition-colors ${
                currentFilters.status === button.value
                  ? button.color.replace('hover:', '')
                  : button.color
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
              className="text-sm text-fire-primary hover:text-fire-secondary transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCases} / {totalCases} cases
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
