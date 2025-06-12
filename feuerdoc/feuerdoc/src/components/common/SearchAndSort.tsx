'use client';

import React from 'react';
import ViewToggle, { ViewMode } from './ViewToggle';

export type SortField = 'created_at' | 'updated_at' | 'title' | 'location' | 'status';
export type SortOrder = 'asc' | 'desc';
export type StatusFilter = 'all' | 'Open' | 'InProgress' | 'Completed' | 'Closed';

interface SearchAndSortProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  totalCases: number;
  filteredCases: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const SearchAndSort: React.FC<SearchAndSortProps> = ({
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  totalCases,
  filteredCases,
  viewMode,
  onViewModeChange,
}) => {
  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle order if same field
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for date fields, asc for others
      const defaultOrder = field.includes('_at') ? 'desc' : 'asc';
      onSortChange(field, defaultOrder);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-fire-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-fire-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="glass-card p-6 rounded-lg shadow-lg mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Section */}
        <div className="flex-1 w-full lg:max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cases by title, location, or status..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fire-primary focus:border-fire-primary"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="block px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-fire-primary focus:border-fire-primary text-sm"
          >
            <option value="all">All</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center">Sort by:</span>
          
          <button
            onClick={() => handleSortFieldChange('created_at')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              sortField === 'created_at'
                ? 'bg-fire-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Created {getSortIcon('created_at')}
          </button>

          <button
            onClick={() => handleSortFieldChange('updated_at')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              sortField === 'updated_at'
                ? 'bg-fire-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Updated {getSortIcon('updated_at')}
          </button>

          <button
            onClick={() => handleSortFieldChange('title')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              sortField === 'title'
                ? 'bg-fire-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Title {getSortIcon('title')}
          </button>

          <button
            onClick={() => handleSortFieldChange('location')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              sortField === 'location'
                ? 'bg-fire-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Location {getSortIcon('location')}
          </button>

          <button
            onClick={() => handleSortFieldChange('status')}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              sortField === 'status'
                ? 'bg-fire-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Status {getSortIcon('status')}
          </button>

          {/* View Toggle */}
          <div className="ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
            <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCases} of {totalCases} cases
          {searchQuery && (
            <span className="ml-2">
              matching "<span className="font-medium text-gray-900 dark:text-gray-100">{searchQuery}</span>"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="ml-2">
              with status <span className="font-medium text-gray-900 dark:text-gray-100">{statusFilter}</span>
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SearchAndSort;
