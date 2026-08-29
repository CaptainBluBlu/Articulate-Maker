import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { CATEGORIES, Category } from '../types';
import ArticulateCard from '../components/ArticulateCard';
import { playAlarm } from '../lib/audio';

type Mode = 'view' | 'play';

export default function PlayPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { data } = useStore(deckId);
  const [mode, setMode] = useState<Mode>('view');
  
  const [currentCard, setCurrentCard] = useState<Partial<Record<Category, string>>>({});
  const [spadeCategory, setSpadeCategory] = useState<Category | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [turnFinished, setTurnFinished] = useState(false);
  const [cardsGenerated, setCardsGenerated] = useState(0);
  
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
      if (!isPlaying || turnFinished) {
        startTurn();
        setCardsGenerated(1);
      } else {
        setCardsGenerated(prev => prev + 1);
      }
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
    setCardsGenerated(0);
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

          {mode === 'play' && (isPlaying || turnFinished) && (
            <div className="w-full max-w-sm mx-auto mt-12 sm:mt-0 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between mb-4 z-10 relative">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Left</span>
                <span className={`text-3xl font-black tabular-nums transition-colors duration-300 ${
                  timeLeft <= 5 && !turnFinished ? 'text-red-500 animate-pulse' : 'text-gray-900'
                }`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="h-10 w-[2px] bg-gray-200 rounded-full"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cards</span>
                <span className="text-3xl font-black tabular-nums text-[#E11D48]">
                  {cardsGenerated}
                </span>
              </div>
            </div>
          )}

          <div className={`flex-1 flex flex-col items-center justify-center relative ${mode !== 'play' || (!isPlaying && !turnFinished) ? 'mt-12 sm:mt-0' : ''}`}>
            <ArticulateCard data={currentCard} spadeCategory={spadeCategory} />
          </div>

          <div className="flex justify-center gap-4 mt-6 sm:mt-4 h-16 relative z-20 shrink-0">
            {mode === 'play' && turnFinished ? (
              <button
                onClick={handleStopTurn}
                className="bg-[#E11D48] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-rose-200"
              >
                STOP TURN
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-transform"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {mode === 'play' && !isPlaying ? 'START TURN' : (mode === 'play' ? 'NEXT CARD' : 'GENERATE')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
