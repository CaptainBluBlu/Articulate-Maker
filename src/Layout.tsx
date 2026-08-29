import React, { useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { currentDeck, notFound } = useStore(deckId);
  const [copied, setCopied] = useState(false);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! We couldn't find that deck.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/${deckId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans flex flex-col overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm">

        {/* Left: Back to Home */}
        <div className="flex items-center gap-3 md:w-auto">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-200">
            <img src="/pwa-192x192.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <button
            id="home-btn"
            onClick={() => navigate('/')}
            className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            ← Change Decks
          </button>
        </div>

        {/* Center Nav */}
        <nav className="flex bg-gray-100 p-1 rounded-xl">
          <NavLink
            to={`/${deckId}`}
            end
            className={({ isActive }) =>
              `px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${isActive
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            CREATE
          </NavLink>
          <NavLink
            to={`/${deckId}/database`}
            className={({ isActive }) =>
              `px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${isActive
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            DATABASE
          </NavLink>
          <NavLink
            to={`/${deckId}/play`}
            className={({ isActive }) =>
              `px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${isActive
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            PLAYROOM
          </NavLink>
        </nav>

        {/* Right: Deck info + share */}
        <div className="flex items-center gap-3 md:w-auto justify-end">
          <button
            id="share-link-btn"
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Share
          </button>

          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Card Deck</p>
            <p className="text-lg font-mono font-bold leading-none whitespace-nowrap" title={currentDeck?.name}>
              {currentDeck?.name ?? '…'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-lg"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            Link copied, share them with your friends
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
