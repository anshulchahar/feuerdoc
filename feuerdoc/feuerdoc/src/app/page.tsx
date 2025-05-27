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
    <div className="flex flex-col items-center h-full w-full">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-fire-primary">Feuer</span>Doc
        </h1>
        <p className="text-xl text-gray-400">
          AI-Powered Documentation for Fire Departments
        </p>
      </div>
      <div className="mb-8">
        <button
          onClick={() => setIsCreateCaseModalOpen(true)}
          className="bg-fire-primary hover:bg-fire-secondary text-white font-bold py-3 px-6 rounded-lg shadow-fire mr-4"
        >
          Create New Case
        </button>
      </div>

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
        <h2 className="text-3xl font-semibold mb-6 text-gray-100 text-center">
          Existing Cases
        </h2>
        <CaseList />
      </div>
    </div>
  );
}
