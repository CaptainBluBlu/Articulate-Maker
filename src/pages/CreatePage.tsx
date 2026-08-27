import React, { useState } from 'react';
import { CATEGORIES, Category, CATEGORY_TEXT_COLORS } from '../types';
import { useStore } from '../store';
import { CheckCircle } from 'lucide-react';

export default function CreatePage() {
  const { addEntries, getStats } = useStore();
  const stats = getStats();
  
  const [formData, setFormData] = useState<Partial<Record<Category, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (cat: Category, value: string) => {
    if (value.length <= 100) {
      setFormData(prev => ({ ...prev, [cat]: value }));
    }
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
    <div className="flex-1 flex gap-6 p-6 overflow-hidden max-w-[1024px] mx-auto w-full animate-in fade-in duration-500 flex-col md:flex-row">
      <section className="md:w-[420px] w-full shrink-0 bg-white rounded-3xl border border-gray-200 flex flex-col shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold">Card Creator</h2>
          <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">ID: #ART-882</span>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {CATEGORIES.map(cat => {
              const length = formData[cat]?.length || 0;
              const textClass = CATEGORY_TEXT_COLORS[cat];
              // Extract hex color from class to use for focus ring (e.g. text-[#E11D48] -> #E11D48)
              const hexMatch = textClass.match(/text-\[(.*?)\]/);
              const hexColor = hexMatch ? hexMatch[1] : '';
              
              return (
                <div key={cat} className="space-y-1">
                  <label className={`text-[10px] font-black uppercase ${textClass} flex justify-between`}>
                    <span>{cat}</span>
                    <span className={length >= 100 ? 'text-red-500 font-bold' : 'text-gray-400'}>
                      {length}/100
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData[cat] || ''}
                    onChange={(e) => handleChange(cat, e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none transition-colors"
                    style={{ borderColor: formData[cat] ? hexColor : undefined }}
                    onFocus={(e) => e.target.style.borderColor = hexColor}
                    onBlur={(e) => { if (!formData[cat]) e.target.style.borderColor = ''; }}
                    placeholder={`e.g. new ${cat.toLowerCase()} word...`}
                    maxLength={100}
                  />
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-[#E11D48]"></div>
              <div className="h-2 w-2 rounded-full bg-[#2563EB]"></div>
              <div className="h-2 w-2 rounded-full bg-[#0D9488]"></div>
            </div>
            <button
              type="submit"
              className="bg-[#E11D48] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center gap-2"
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

      <section className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 shrink-0">
          {CATEGORIES.map(cat => (
            <div key={cat} className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-sm p-4 sm:h-24">
              <p className="text-[9px] font-bold text-gray-400 uppercase">{cat}</p>
              <p className={`text-xl font-bold ${CATEGORY_TEXT_COLORS[cat]}`}>
                {stats[cat]}
              </p>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col items-center justify-center shadow-2xl relative">
          <div className="text-center text-gray-400 font-bold uppercase tracking-widest opacity-50">
            Switch to Playroom to view and play your cards
          </div>
        </div>
      </section>
    </div>
  );
}
