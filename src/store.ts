import { useState, useEffect } from 'react';
import { CardData, CATEGORIES, Category } from './types';

const STORAGE_KEY = 'articulate-data';

const initialData: CardData = {
  Person: [],
  World: [],
  Object: [],
  Action: [],
  Nature: [],
  Random: [],
};

export function useStore() {
  const [data, setData] = useState<CardData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as CardData;
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addEntries = (entries: Partial<Record<Category, string>>) => {
    setData((prev) => {
      const newData = { ...prev };
      CATEGORIES.forEach((cat) => {
        if (entries[cat] && entries[cat]?.trim().length! > 0) {
          newData[cat] = [...newData[cat], entries[cat]!.trim()];
        }
      });
      return newData;
    });
  };

  const getStats = (): Record<Category, number> => {
    const stats = {} as Record<Category, number>;
    CATEGORIES.forEach((cat) => {
      stats[cat] = data[cat].length;
    });
    return stats;
  };

  return { data, addEntries, getStats };
}
