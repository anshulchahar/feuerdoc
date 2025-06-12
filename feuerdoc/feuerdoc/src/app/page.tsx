'use client';

import { useState, useRef } from "react";
import Modal from "@/components/common/Modal";
import CreateCaseForm from "@/components/cases/CreateCaseForm";
import { Case } from "@/types";
import CaseList, { CaseListRef } from "@/components/cases/CaseList"; // Import CaseList and ref type

export default function HomePage() {
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false);
  const caseListRef = useRef<CaseListRef>(null);

  const handleCaseCreated = (newCase: Case) => {
    console.log("New case created on HomePage:", newCase);
    // Immediately refresh the case list to show the new case
    if (caseListRef.current) {
      caseListRef.current.refreshCases();
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      {/* Modern Circular Create Button - Fixed Position */}
      <button
        onClick={() => setIsCreateCaseModalOpen(true)}
        className="fixed bottom-8 right-8 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-black w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
        title="Create New Case"
      >
        <svg 
          className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      </button>

      <Modal
        isOpen={isCreateCaseModalOpen}
        onClose={() => setIsCreateCaseModalOpen(false)}
        title="Create New Case"
      >
        <CreateCaseForm
          onCaseCreated={handleCaseCreated}
          onClose={() => setIsCreateCaseModalOpen(false)}
        />
      </Modal>

      <div className="w-full max-w-5xl px-4">
        <CaseList ref={caseListRef} />
      </div>
    </div>
  );
}
