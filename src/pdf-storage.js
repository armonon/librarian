const DATABASE = 'librarian.pdfs';
const STORE = 'pdfs';
const INDEX = 'library';

export async function encodePdfRecord(record) {
  const { blob, ...metadata } = record;
  if (!(blob instanceof Blob)) throw new TypeError('PDF data must be a Blob');
  // Persist owned bytes, not a File's transient WebKit file-provider reference.
  return { ...metadata, bytes: await blob.arrayBuffer(), mime: blob.type || 'application/pdf' };
}

export function decodePdfRecord(record) {
  if (!record || record.blob instanceof Blob) return record;
  if (!(record.bytes instanceof ArrayBuffer)) throw new TypeError('Stored PDF bytes are invalid');
  const { bytes, mime, ...metadata } = record;
  return { ...metadata, blob: new Blob([bytes], { type: mime || 'application/pdf' }) };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains(INDEX)) request.result.createObjectStore(INDEX, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error || request.error);
      transaction.onabort = () => reject(transaction.error || new Error('PDF storage transaction aborted'));
    });
  } finally { database.close(); }
}

export async function pdfPut(record) {
  const stored = await encodePdfRecord(record);
  await transact('readwrite', store => store.put(stored));
}

export async function pdfGet(id) {
  return decodePdfRecord(await transact('readonly', store => store.get(id)));
}

export async function pdfDel(id) {
  await libraryTransaction(transaction => {
    transaction.objectStore(STORE).delete(id);
    return transaction.objectStore(INDEX).delete(id);
  });
}

async function libraryTransaction(operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE, INDEX], 'readwrite');
      let request;
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = () => reject(transaction.error || request?.error);
      transaction.onabort = () => reject(transaction.error || new Error('Library save aborted'));
      try { request = operation(transaction); }
      catch (error) { transaction.abort(); reject(error); }
    });
  } finally { database.close(); }
}

export async function pdfSave(metadata, blob) {
  if (!metadata?.id || typeof metadata.title !== 'string') throw new TypeError('Invalid PDF metadata');
  const record = await encodePdfRecord({ id: metadata.id, blob });
  await libraryTransaction(transaction => {
    transaction.objectStore(STORE).put(record);
    return transaction.objectStore(INDEX).put(metadata);
  });
}

export async function pdfLibrary(legacy = []) {
  // Migrate only metadata with surviving bytes. A marker prevents stale legacy
  // localStorage from resurrecting entries removed by another tab.
  return libraryTransaction(transaction => {
    const index = transaction.objectStore(INDEX);
    const marker = index.get('__legacy_migrated__');
    marker.onsuccess = () => {
      if (marker.result) return;
      for (const entry of Array.isArray(legacy) ? legacy : []) {
        if (!entry || typeof entry.id !== 'string' || typeof entry.title !== 'string') continue;
        const request = transaction.objectStore(STORE).getKey(entry.id);
        request.onsuccess = () => { if (request.result) index.put(entry); };
      }
      index.put({ id: '__legacy_migrated__' });
    };
  }).then(async () => {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(INDEX, 'readonly');
        const request = transaction.objectStore(INDEX).getAll();
        transaction.oncomplete = () => resolve(request.result.filter(x => x.id !== '__legacy_migrated__').sort((a, b) => b.addedAt - a.addedAt));
        transaction.onabort = transaction.onerror = () => reject(transaction.error || request.error);
      });
    } finally { database.close(); }
  });
}
