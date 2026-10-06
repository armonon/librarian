export function readingPage(value, total = Number.MAX_SAFE_INTEGER) {
  return Math.max(1, Math.min(Math.max(1, total), Math.floor(Number(value) || 1)));
}
export function libraryItems(items, query = '', filter = 'all', sort = 'recent') {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter(item => (!needle || `${item.title} ${item.author || ''}`.toLocaleLowerCase().includes(needle)) &&
    (filter === 'all' || (filter === 'finished' ? item.finished : filter === 'reading' ? item.lastReadAt && !item.finished : !item.lastReadAt && !item.finished)))
    .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : (b.lastReadAt || b.addedAt || 0) - (a.lastReadAt || a.addedAt || 0));
}
export function readableLink(book) {
  for (const link of book.links || []) {
    try {
      const url = new URL(link.url);
      if (url.protocol !== 'https:') continue;
      if (/\.pdf($|\?)/i.test(url.href) || /pdf/i.test(link.label)) return { ...link, format: 'pdf' };
    } catch {}
  }
  for (const link of book.links || []) {
    try {
      const url = new URL(link.url);
      const match = url.pathname.match(/^\/ebooks\/(\d+)\/?$/);
      if (url.protocol === 'https:' && url.hostname === 'www.gutenberg.org' && match) return { ...link, format: 'text', gutenbergId: match[1] };
    } catch {}
  }
  return null;
}
export async function validatePdf(blob) {
  const header = await blob.slice(0, 1024).text();
  if (!header.includes('%PDF-')) throw new Error('This file is not a PDF. The source may have returned a sign-in page.');
}
export function textPages(text, limit = 5500) {
  const pages = [];
  let page = '';
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (page.length + line.length > limit && page) { pages.push(page); page = ''; }
    page += line + '\n';
  }
  if (page) pages.push(page);
  return pages.length ? pages : [''];
}
