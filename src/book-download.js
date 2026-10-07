import { Capacitor, CapacitorHttp } from '@capacitor/core';
export const MAX_BOOK_BYTES = 75 * 1024 * 1024;
export async function fetchPdf(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.username || target.password) throw new Error('A secure PDF download link is required.');
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url: target.href, responseType: 'arraybuffer', readTimeout: 30000, connectTimeout: 15000 });
    if (response.status !== 200 || typeof response.data !== 'string') throw new Error('The PDF host could not provide this file.');
    if (response.data.length > MAX_BOOK_BYTES * 4 / 3 + 4) throw new Error('This book exceeds the 75 MB download limit.');
    const data = atob(response.data);
    return new Blob([Uint8Array.from(data, character => character.charCodeAt(0))], { type: 'application/pdf' });
  }
  const response = await fetch(target.href, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Could not download this PDF.');
  return boundedPdf(response);
}
export async function boundedPdf(response) {
  if (Number(response.headers.get('content-length')) > MAX_BOOK_BYTES) throw new Error('This book exceeds the 75 MB download limit.');
  if (!response.body) throw new Error('The PDF download was empty.');
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_BOOK_BYTES) { await reader.cancel(); throw new Error('This book exceeds the 75 MB download limit.'); }
      chunks.push(result.value);
    }
    return new Blob(chunks, { type: 'application/pdf' });
  } finally { reader.releaseLock(); }
}
