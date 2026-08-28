import { useState, useEffect } from 'react';
import { CardData, CATEGORIES, Category } from './types';

const initialData: CardData = {
  Person: [],
  World: [],
  Object: [],
  Action: [],
  Nature: [],
  Random: [],
};

export function useStore() {
  const [data, setData] = useState<CardData>(initialData);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards');
      if (response.ok) {
        const fetchedData = await response.json();
        setData({ ...initialData, ...fetchedData });
      }
    } catch (e) {
      console.error('Failed to fetch cards', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const addEntries = async (entries: Partial<Record<Category, string>>) => {
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
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
    } catch (error) {
      console.error('Failed to save cards', error);
      fetchCards();
    }
  };

  const getStats = (): Record<Category, number> => {
    const stats = {} as Record<Category, number>;
    CATEGORIES.forEach((cat) => {
      stats[cat] = data[cat].length;
    });
    return stats;
  };

  return { data, addEntries, getStats, loading };
}
