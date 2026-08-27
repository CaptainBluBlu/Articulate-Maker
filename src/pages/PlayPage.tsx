import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { CATEGORIES, Category } from '../types';
import ArticulateCard from '../components/ArticulateCard';
import { playAlarm } from '../lib/audio';

type Mode = 'view' | 'play';

export default function PlayPage() {
  const { data } = useStore();
  const [mode, setMode] = useState<Mode>('view');
  
  const [currentCard, setCurrentCard] = useState<Partial<Record<Category, string>>>({});
  const [spadeCategory, setSpadeCategory] = useState<Category | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [turnFinished, setTurnFinished] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  const getRandomItem = (arr: string[]) => {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const handleGenerate = () => {
    const newCard: Partial<Record<Category, string>> = {};
    CATEGORIES.forEach(cat => {
      newCard[cat] = getRandomItem(data[cat]);
    });
    
    setCurrentCard(newCard);
    
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setSpadeCategory(randomCat);

    if (mode === 'play') {
      startTurn();
    }
  };

  const startTurn = () => {
    setIsPlaying(true);
    setTurnFinished(false);
    setTimeLeft(30);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTurnFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTurnFinish = () => {
    setTurnFinished(true);
    playAlarm();
  };

  const handleStopTurn = () => {
    setIsPlaying(false);
    setTurnFinished(false);
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const hasAnyData = CATEGORIES.some(cat => data[cat].length > 0);

  return (
    <div className="flex-1 flex flex-col max-w-[1024px] mx-auto w-full p-4 sm:p-6 animate-in fade-in duration-500">
      {!hasAnyData ? (
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col items-center justify-center shadow-2xl relative">
          <div className="text-center text-gray-400 font-bold uppercase tracking-widest">
            You haven't added any words to your deck yet.
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-4 sm:p-8 flex flex-col relative shadow-2xl overflow-hidden">
          
          <div className="absolute top-4 sm:top-6 right-4 sm:right-8 flex items-center gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg z-20 shadow-sm">
            <button
              onClick={() => { setMode('view'); handleStopTurn(); }}
              disabled={isPlaying && !turnFinished}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                mode === 'view' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              } ${(isPlaying && !turnFinished) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              VIEW
            </button>
            <button
              onClick={() => { setMode('play'); handleStopTurn(); }}
              disabled={isPlaying && !turnFinished}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                mode === 'play' ? 'bg-[#E11D48] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              } ${(isPlaying && !turnFinished) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              PLAY
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative mt-12 sm:mt-0">
            <ArticulateCard data={currentCard} spadeCategory={spadeCategory} />
          </div>

          <div className="flex justify-center gap-4 mt-6 sm:mt-4 h-16 relative z-20 shrink-0">
            {(!isPlaying || turnFinished) && (
              <button
                onClick={handleGenerate}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-transform"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {mode === 'play' ? 'START TURN' : 'GENERATE'}
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'play' && isPlaying && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white w-[90%] sm:w-[400px] rounded-[40px] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center mb-6 transition-colors duration-300 ${timeLeft <= 5 && !turnFinished ? 'border-red-500 animate-pulse' : 'border-[#E11D48]'}`}>
              <span className={`text-4xl font-black tabular-nums ${timeLeft <= 5 && !turnFinished ? 'text-red-500' : 'text-gray-900'}`}>
                {timeLeft}
              </span>
            </div>
            
            <h3 className="text-2xl font-black uppercase mb-2">
              {turnFinished ? "Time's Up!" : "Turn in Progress"}
            </h3>
            <p className="text-gray-500 mb-8 font-medium">
              {turnFinished ? "End of turn. Hand over the device!" : "Don't stop until the buzzer!"}
            </p>
            
            {turnFinished && (
              <button
                onClick={handleStopTurn}
                className="w-full bg-[#E11D48] py-4 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-rose-200"
              >
                STOP TURN
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
