export function pdfDownload(record, title) {
  if (!(record?.blob instanceof Blob) || !record.blob.size) {
    throw new Error('The saved PDF is unavailable. Add the original PDF again.');
  }
  const base = String(title || 'Librarian document').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/\.pdf$/i, '').slice(0, 180).trim() || 'Librarian document';
  return { blob: record.blob, name: `${base}.pdf` };
}
