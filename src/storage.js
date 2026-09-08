import { emptyState } from './core.js';

export const STATE_STORAGE_KEY = 'autumn-recruit-assistant.state.v1.0';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`本地数据读取失败：${key}`, error);
    return fallback;
  }
}

export function loadState() { return readJson(STATE_STORAGE_KEY, emptyState()); }
export function saveState(state) { localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state)); }
