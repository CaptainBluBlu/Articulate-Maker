import React from 'react';
import { CATEGORIES, Category, CATEGORY_COLORS, CATEGORY_LETTERS } from '../types';

interface ArticulateCardProps {
  data: Partial<Record<Category, string>>;
  spadeCategory?: Category | null;
}

export default function ArticulateCard({ data, spadeCategory }: ArticulateCardProps) {
  return (
    <div className="w-full max-w-[340px] sm:max-w-none sm:w-[420px] sm:aspect-[4/3] bg-white rounded-md shadow-2xl mx-auto flex flex-col justify-between py-3.5 sm:py-6 px-3 sm:px-5 relative border border-gray-200 gap-1.5 sm:gap-0">
      {CATEGORIES.map((cat) => {
        const hasSpade = spadeCategory === cat;
        // Extract just the background color
        const bgClass = CATEGORY_COLORS[cat].split(' ')[0];

        return (
          <div key={cat} className="flex items-center w-full h-8 sm:h-12">
            {/* Left Square */}
            <div 
              className={`w-7 h-7 sm:w-11 sm:h-11 border-2 sm:border-[3px] border-[#1a1a1a] flex-shrink-0 flex items-center justify-center ${bgClass}`}
            >
              <span className="font-serif text-lg sm:text-3xl text-[#1a1a1a]" style={{ fontWeight: 800 }}>
                {CATEGORY_LETTERS[cat]}
              </span>
            </div>

            {/* Middle Text */}
            <div className="flex-1 px-2.5 sm:px-5 text-left overflow-hidden">
              <span className="font-sans text-sm sm:text-[22px] text-gray-900 truncate block font-normal tracking-tight">
                {data[cat] || ''}
              </span>
            </div>

            {/* Right Square */}
            <div 
              className={`w-7 h-7 sm:w-11 sm:h-11 border-2 sm:border-[3px] border-[#1a1a1a] flex-shrink-0 flex items-center justify-center ${bgClass}`}
            >
              {hasSpade && (
                <span className="text-xl sm:text-4xl text-[#1a1a1a] leading-none pb-0.5">♠</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
