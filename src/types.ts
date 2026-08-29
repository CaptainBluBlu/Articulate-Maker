export type Category = 'Person' | 'World' | 'Object' | 'Action' | 'Nature' | 'Random';

export const CATEGORIES: Category[] = [
  'Person',
  'World',
  'Object',
  'Action',
  'Nature',
  'Random',
];

export interface CardData {
  Person: string[];
  World: string[];
  Object: string[];
  Action: string[];
  Nature: string[];
  Random: string[];
}

export interface CardEntry {
  id: number;
  deck_id: string;
  category: Category;
  text: string;
}

export interface Deck {
  id: string;
  name: string;
  created_at: string;
}

export interface Visitor {
  visitor_id: string;
  ip_address: string;
  user_agent: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  device_type: string;
  device_vendor: string;
  device_model: string;
  timezone: string | null;
  language: string | null;
  screen_resolution: string | null;
  referrer: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface DeckLog {
  id: number;
  deck_id: string;
  deck_name?: string;
  visitor_id: string;
  action: string;
  details: string | null;
  created_at: string;
  browser_name?: string;
  os_name?: string;
  ip_address?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Person: 'bg-[#EAB308] text-black',
  World: 'bg-[#1E3A8A] text-white',
  Object: 'bg-[#38BDF8] text-black',
  Action: 'bg-[#F97316] text-white',
  Nature: 'bg-[#14532D] text-white',
  Random: 'bg-[#7F1D1D] text-white',
};

export const CATEGORY_TEXT_COLORS: Record<Category, string> = {
  Person: 'text-[#EAB308]',
  World: 'text-[#1E3A8A]',
  Object: 'text-[#38BDF8]',
  Action: 'text-[#F97316]',
  Nature: 'text-[#14532D]',
  Random: 'text-[#7F1D1D]',
};

export const CATEGORY_LETTERS: Record<Category, string> = {
  Person: 'P',
  World: 'W',
  Object: 'O',
  Action: 'A',
  Nature: 'N',
  Random: 'R',
};
