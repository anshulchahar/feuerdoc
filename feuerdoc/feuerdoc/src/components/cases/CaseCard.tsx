'use client';

import React from 'react';
import { Case } from '@/types';
import Link from 'next/link';

interface CaseCardProps {
  caseData: Case;
  onClick: () => void; // For opening a detail view/modal
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, onClick }) => {
  return (
    <div 
      className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-fire-primary transition-all cursor-pointer shadow-md hover:shadow-fire"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-fire-primary mb-1 truncate">{caseData.title}</h3>
      <p className="text-sm text-gray-400 mb-1 truncate">Location: {caseData.location}</p>
      <p className="text-xs text-gray-500 mb-2">Status: {caseData.status}</p>
      <p className="text-xs text-gray-500">Last Updated: {new Date(caseData.updatedAt).toLocaleDateString()}</p>
      {/* Link to a dedicated case page, if needed in the future */}
      {/* <Link href={`/cases/${caseData.id}`} className="text-sm text-fire-primary hover:underline mt-2 inline-block">
        View Details
      </Link> */}
    </div>
  );
};

export default CaseCard;
