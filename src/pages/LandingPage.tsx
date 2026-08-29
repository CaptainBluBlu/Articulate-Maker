import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Layers, ArrowRight, Link2, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { createDeck } = useStore();

  const [deckName, setDeckName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const id = await createDeck(deckName.trim());
      if (id) {
        navigate(`/${id}`);
      } else {
        setError('Failed to create deck. Please try again.');
      }
    } catch {
      setError('Failed to create deck. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinId.trim();
    if (!trimmed) return;

    // Accept a full URL or a bare ID (nanoid = 21 chars, but be flexible)
    // Try to extract a path segment that looks like an ID (letters/numbers/- _)
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        navigate(`/${segments[0]}`);
        return;
      }
    } catch {
      // Not a URL — treat as a raw ID
    }

    if (trimmed.length >= 6) {
      navigate(`/${trimmed}`);
    } else {
      setError('Invalid deck ID or link. Please check and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-gray-200 rounded-3xl mb-4 shadow-sm">
            <Layers className="w-8 h-8 text-[#E11D48]" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            Articulate
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Create a deck, share the link, play together.
          </p>
        </div>

        {/* Create Deck Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Sparkles className="w-4 h-4 text-[#E11D48]" />
            </div>
            <h2 className="text-gray-900 font-bold text-sm uppercase tracking-widest">
              Create a New Deck
            </h2>
          </div>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              id="deck-name-input"
              type="text"
              placeholder="e.g. Party Night, Game Night 2026..."
              value={deckName}
              onChange={(e) => { setDeckName(e.target.value); setError(null); }}
              maxLength={60}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-[#E11D48] transition-all"
            />
            <button
              id="create-deck-btn"
              type="submit"
              disabled={!deckName.trim() || isCreating}
              className="w-full bg-[#E11D48] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-200"
            >
              {isCreating ? (
                <span className="animate-pulse">Creating...</span>
              ) : (
                <>
                  Create Deck
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Join Deck Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-100 rounded-xl">
              <Link2 className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-gray-900 font-bold text-sm uppercase tracking-widest">
              Join an Existing Deck
            </h2>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              id="deck-join-input"
              type="text"
              placeholder="Paste a deck link or ID..."
              value={joinId}
              onChange={(e) => { setJoinId(e.target.value); setError(null); }}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-gray-400 transition-all font-mono"
            />
            <button
              id="join-deck-btn"
              type="submit"
              disabled={!joinId.trim()}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Join Deck
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center text-[#E11D48] text-sm font-medium bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <p className="text-center text-gray-400 text-xs font-medium">
          No account needed. Decks are permanent and shareable.
        </p>
      </div>
    </div>
  );
}
