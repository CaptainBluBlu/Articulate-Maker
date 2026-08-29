import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { CardData, CardEntry, CATEGORIES, Category, Deck } from './types';

const initialData: CardData = {
  Person: [],
  World: [],
  Object: [],
  Action: [],
  Nature: [],
  Random: [],
};

// ─── Visitor ID Cookie ────────────────────────────────────────────────────────

function getOrCreateVisitorId(): string {
  const key = 'visitor_id';
  const existing = getCookie(key);
  if (existing) return existing;
  const id = nanoid();
  // Set cookie that expires in 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${key}=${id}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  return id;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

export const visitorId = getOrCreateVisitorId();

// ─── API Helper ───────────────────────────────────────────────────────────────

function apiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-visitor-id': visitorId,
  };
}

// ─── Store Hook ───────────────────────────────────────────────────────────────

export function useStore(deckId?: string) {
  const [data, setData] = useState<CardData>(initialData);
  const [rawCards, setRawCards] = useState<CardEntry[]>([]);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeck = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/decks/${id}`, {
        headers: apiHeaders(),
      });
      if (response.ok) {
        const deck: Deck = await response.json();
        setCurrentDeck(deck);
      } else {
        setCurrentDeck(null);
      }
    } catch (e) {
      console.error('Failed to fetch deck', e);
    }
  }, []);

  const fetchCards = useCallback(async () => {
    if (!deckId) return;
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        headers: apiHeaders(),
      });
      if (response.ok) {
        const fetchedData = await response.json();
        setData({ ...initialData, ...fetchedData });
      }
    } catch (e) {
      console.error('Failed to fetch cards', e);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const fetchRawCards = useCallback(async () => {
    if (!deckId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/decks/${deckId}/cards/raw`, {
        headers: apiHeaders(),
      });
      if (response.ok) {
        const fetchedRaw: CardEntry[] = await response.json();
        setRawCards(fetchedRaw);

        const grouped: CardData = {
          Person: [], World: [], Object: [], Action: [], Nature: [], Random: [],
        };
        for (const card of fetchedRaw) {
          if (grouped[card.category]) {
            grouped[card.category].push(card.text);
          }
        }
        setData(grouped);
      }
    } catch (e) {
      console.error('Failed to fetch raw cards', e);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    if (deckId) {
      fetchDeck(deckId);
      fetchCards();
    } else {
      setLoading(false);
    }
  }, [deckId, fetchDeck, fetchCards]);

  const addEntries = async (entries: Partial<Record<Category, string>>) => {
    if (!deckId) return;
    setData((prev) => {
      const newData = { ...prev };
      CATEGORIES.forEach((cat) => {
        if (entries[cat] && entries[cat]?.trim().length! > 0) {
          newData[cat] = [...newData[cat], entries[cat]!.trim()];
        }
      });
      return newData;
    });

    try {
      await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(entries),
      });
      fetchCards();
    } catch (error) {
      console.error('Failed to save cards', error);
      fetchCards();
    }
  };

  const addSingleCard = async (category: Category, text: string) => {
    if (!deckId) return;
    try {
      const res = await fetch(`/api/decks/${deckId}/cards/single`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ category, text }),
      });
      if (res.ok) {
        await fetchRawCards();
      }
    } catch (error) {
      console.error('Failed to add single card', error);
    }
  };

  const uploadBulkCards = async (cards: Array<{ category: string; text: string }>) => {
    if (!deckId) return;
    try {
      const res = await fetch(`/api/decks/${deckId}/cards/bulk`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(cards),
      });
      if (res.ok) {
        await fetchRawCards();
        return await res.json();
      }
    } catch (error) {
      console.error('Failed to bulk upload cards', error);
      throw error;
    }
  };

  const updateCard = async (id: number, category: Category, text: string) => {
    if (!deckId) return;
    try {
      const res = await fetch(`/api/decks/${deckId}/cards/${id}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ category, text }),
      });
      if (res.ok) {
        setRawCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, category, text } : c))
        );
        fetchCards();
      }
    } catch (error) {
      console.error('Failed to update card', error);
    }
  };

  const deleteCard = async (id: number) => {
    if (!deckId) return;
    try {
      const res = await fetch(`/api/decks/${deckId}/cards/${id}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (res.ok) {
        setRawCards((prev) => prev.filter((c) => c.id !== id));
        fetchCards();
      }
    } catch (error) {
      console.error('Failed to delete card', error);
    }
  };

  const getStats = (): Record<Category, number> => {
    const stats = {} as Record<Category, number>;
    CATEGORIES.forEach((cat) => {
      stats[cat] = data[cat].length;
    });
    return stats;
  };

  // Create a new deck and return its ID
  const createDeck = async (name: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const deck: Deck = await res.json();
        return deck.id;
      }
    } catch (error) {
      console.error('Failed to create deck', error);
    }
    return null;
  };

  return {
    data,
    rawCards,
    currentDeck,
    addEntries,
    addSingleCard,
    uploadBulkCards,
    updateCard,
    deleteCard,
    fetchCards,
    fetchRawCards,
    getStats,
    createDeck,
    loading,
  };
}
