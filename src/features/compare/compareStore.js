import { useSyncExternalStore } from 'react';

export const MAX_COMPARE = 3;
const KEY = 'ermi_compare';
const EVT = 'ermi:compare';

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.map(String).slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
};

let cache = read();

const write = (next) => {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
};

const subscribe = (cb) => {
  const onStorage = (e) => { if (e.key === KEY) { cache = read(); cb(); } };
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', onStorage);
  };
};

const getSnapshot = () => cache;

const toggle = (id) => {
  const s = String(id);
  if (cache.includes(s)) { write(cache.filter((x) => x !== s)); return true; }
  if (cache.length >= MAX_COMPARE) { window.dispatchEvent(new Event('ermi:compare-full')); return false; }
  write([...cache, s]);
  return true;
};
const remove = (id) => write(cache.filter((x) => x !== String(id)));
const clear = () => write([]);

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ids, toggle, remove, clear };
}