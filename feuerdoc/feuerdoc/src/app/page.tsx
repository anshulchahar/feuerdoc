'use client';

import { useState } from "react";
import Modal from "@/components/common/Modal";
import CreateCaseForm from "@/components/cases/CreateCaseForm";
import { Case } from "@/types";
import CaseList from "@/components/cases/CaseList"; // Import CaseList

export default function HomePage() {
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false);

  const handleCaseCreated = (newCase: Case) => {
    console.log("New case created on HomePage:", newCase);
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      {/* Modern Circular Create Button - Fixed Position */}
      <button
        onClick={() => setIsCreateCaseModalOpen(true)}
        className="fixed bottom-8 right-8 bg-fire-primary hover:bg-fire-secondary text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
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
        <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100 text-center">
          Cases
        </h2>
        <CaseList />
      </div>
    </div>
  );
}
