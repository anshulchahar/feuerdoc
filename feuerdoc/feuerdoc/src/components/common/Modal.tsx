import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200"
        style={{ 
          backgroundColor: 'white',
          borderColor: '#e5e7eb',
          color: '#111827',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl transition-colors"
            style={{ color: '#4b5563' }}
          >
            &times;
          </button>
        </div>
        <div style={{ color: '#111827' }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
