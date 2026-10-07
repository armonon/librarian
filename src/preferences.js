export function readPreference(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
export function writePreference(key, value) {
  try { localStorage.setItem(key, String(value)); return true; } catch { return false; }
}
export function readList(key, valid) {
  try { const value = JSON.parse(readPreference(key, '[]')); return Array.isArray(value) ? value.filter(valid) : []; } catch { return []; }
}
export function zoomPreference(value) {
  const zoom = Number(value);
  return Number.isFinite(zoom) && zoom > 0 ? Math.max(.5, Math.min(3, zoom)) : 1;
}
