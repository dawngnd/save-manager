import React, { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sheet Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0e1621] border-t border-[#2b394a] rounded-t-2xl z-50 transition-transform duration-300 transform shadow-2xl overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#2c3847] rounded-full mx-auto my-3 cursor-pointer" onClick={onClose} />
        
        <div className="px-5 pb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#f5f5f5]">{title}</h3>
            <button
              className="text-[#708499] hover:text-[#f5f5f5] text-2xl font-semibold transition cursor-pointer"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};
