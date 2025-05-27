'use client';

import React from 'react';
import { Case } from '@/types';
import Link from 'next/link';

interface CaseCardProps {
  caseData: Case;
  onClick: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, onClick }) => {
  return (
    <div
      className="bg-brand-gray-dark p-5 rounded-xl border border-brand-gray-medium hover:border-fire-primary transition-all duration-300 ease-in-out cursor-pointer shadow-lg hover:shadow-fire-light transform hover:-translate-y-1"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <h3 className="text-xl font-semibold text-fire-primary mb-2 truncate" title={caseData.title}>{caseData.title}</h3>
      <p className="text-sm text-brand-gray-light mb-1 truncate" title={caseData.location}>Location: {caseData.location}</p>
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${caseData.status === 'Open' ? 'bg-blue-500 text-white' : caseData.status === 'InProgress' ? 'bg-yellow-500 text-black' : caseData.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {caseData.status}
        </span>
        <p className="text-xs text-brand-gray-medium">ID: {caseData.id.substring(0, 8)}...</p>
      </div>
      <p className="text-xs text-brand-gray-medium">Last Updated: {new Date(caseData.updatedAt).toLocaleDateString()}</p>
    </div>
  );
};

export default CaseCard;
