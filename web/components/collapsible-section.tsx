'use client';

import { useState, useEffect, ReactNode } from 'react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  completionStatus?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

/**
 * Collapsible Section Component — Issue #184
 * 
 * Expandable/collapsible section with smooth animation.
 * Remembers expand state in localStorage.
 */
export function CollapsibleSection({
  id,
  title,
  completionStatus,
  defaultExpanded = true,
  children,
}: CollapsibleSectionProps): React.ReactElement {
  const storageKey = `section-expanded-${id}`;
  
  const [isExpanded, setIsExpanded] = useState(() => {
    // Check localStorage on initial render (client-side only)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  });

  // Persist expand state to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, String(isExpanded));
  }, [isExpanded, storageKey]);

  const toggleExpanded = (): void => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {completionStatus && (
          <span className="text-sm text-gray-500">{completionStatus}</span>
        )}
      </button>
      
      <div
        id={`section-content-${id}`}
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
