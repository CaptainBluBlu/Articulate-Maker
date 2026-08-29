import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CATEGORIES, Category, CATEGORY_TEXT_COLORS } from '../types';
import { useStore } from '../store';
import { CheckCircle } from 'lucide-react';

export default function CreatePage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { addEntries, getStats } = useStore(deckId);
  const stats = getStats();
  
  const [formData, setFormData] = useState<Partial<Record<Category, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (cat: Category, value: string) => {
    setFormData(prev => ({ ...prev, [cat]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one field has value
    const hasValue = CATEGORIES.some(cat => formData[cat] && formData[cat]!.trim().length > 0);
    
    if (hasValue) {
      addEntries(formData);
      setFormData({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 overflow-y-auto max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      {/* Category Trackers Grid - Hidden on mobile, visible on sm and up */}
      <div className="hidden sm:grid sm:grid-cols-6 gap-2.5 md:gap-3 shrink-0">
        {CATEGORIES.map(cat => (
          <div 
            key={cat} 
            className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-sm p-3 md:p-4 h-20 md:h-24 min-w-0"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate w-full text-center leading-tight">
              {cat}
            </p>
            <p className={`text-xl md:text-2xl font-bold leading-tight mt-0.5 ${CATEGORY_TEXT_COLORS[cat]}`}>
              {stats[cat]}
            </p>
          </div>
        ))}
      </div>

      {/* Card Creator Form */}
      <section className="w-full bg-white rounded-3xl border border-gray-200 flex flex-col shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Card Creator</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-4">
            {CATEGORIES.map(cat => {
              const textClass = CATEGORY_TEXT_COLORS[cat];
              // Extract hex color from class to use for focus ring (e.g. text-[#E11D48] -> #E11D48)
              const hexMatch = textClass.match(/text-\[(.*?)\]/);
              const hexColor = hexMatch ? hexMatch[1] : '';
              
              return (
                <div key={cat} className="space-y-1 sm:space-y-2">
                  <label className={`text-xs sm:text-sm font-black uppercase ${textClass} flex justify-between items-center`}>
                    <span className="flex items-center gap-1.5">
                      <span>{cat}</span>
                      <span className="sm:hidden font-mono font-semibold text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                        ({stats[cat]} added)
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData[cat] || ''}
                    onChange={(e) => handleChange(cat, e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-lg outline-none transition-colors"
                    style={{ borderColor: formData[cat] ? hexColor : undefined }}
                    onFocus={(e) => e.target.style.borderColor = hexColor}
                    onBlur={(e) => { if (!formData[cat]) e.target.style.borderColor = ''; }}
                    placeholder={`e.g. new ${cat.toLowerCase()} word...`}
                  />
                </div>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-[#EAB308]"></div>
              <div className="h-2 w-2 rounded-full bg-[#1E3A8A]"></div>
              <div className="h-2 w-2 rounded-full bg-[#38BDF8]"></div>
              <div className="h-2 w-2 rounded-full bg-[#F97316]"></div>
              <div className="h-2 w-2 rounded-full bg-[#14532D]"></div>
              <div className="h-2 w-2 rounded-full bg-[#7F1D1D]"></div>
            </div>
            <button
              type="submit"
              className="bg-[#E11D48] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {showSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  SAVED
                </>
              ) : (
                'SAVE CARD'
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
