import { useEffect, useState } from 'react';

const STORAGE_KEY = 'lexdesk:recent-items';
const EVENT_NAME = 'lexdesk:recent-changed';

export type RecentType = 'matter' | 'client' | 'contact' | 'lead' | 'document';

export type RecentItem = {
  type: RecentType;
  id: number;
  title: string;
};

function read(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function recordPath(type: RecentType, id: number) {
  const routes: Record<RecentType, string> = {
    matter: 'matters',
    client: 'clients',
    contact: 'contacts',
    lead: 'leads',
    document: 'documents',
  };
  return `/${routes[type]}/${id}`;
}

export function useTrackVisit(type: RecentType, id: number | undefined, title: string | undefined) {
  useEffect(() => {
    if (!id || !title) return;
    const items = read().filter((item) => !(item.type === type && item.id === id));
    items.unshift({ type, id, title });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
    window.dispatchEvent(new Event(EVENT_NAME));
  }, [type, id, title]);
}

export function useRecent() {
  const [items, setItems] = useState<RecentItem[]>(() => read());
  useEffect(() => {
    const update = () => setItems(read());
    window.addEventListener(EVENT_NAME, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(EVENT_NAME, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return items;
}
