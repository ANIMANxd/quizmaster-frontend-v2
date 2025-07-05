'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 
        flex items-center justify-center 
        bg-transparent 
        backdrop-blur-sm 
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white/95 backdrop-blur-lg 
          rounded-xl shadow-2xl 
          w-full max-w-2xl max-h-[90vh] 
          overflow-hidden flex flex-col text-gray-900
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
