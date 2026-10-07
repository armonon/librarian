// Project Gutenberg's official OPDS search feed is a fallback for Gutendex.
export function parseGutenbergCatalog(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid Gutenberg catalog');
  const ns = 'http://www.w3.org/2005/Atom';
  if (doc.documentElement.localName !== 'feed' || doc.documentElement.namespaceURI !== ns) throw new Error('Invalid Gutenberg feed');
  return [...doc.getElementsByTagNameNS(ns, 'entry')].flatMap(entry => {
    const value = name => entry.getElementsByTagNameNS(ns, name)[0]?.textContent.trim() || '';
    const match = value('id').match(/^https?:\/\/www\.gutenberg\.org\/ebooks\/([1-9]\d{0,6})\.opds$/);
    const title = value('title');
    if (!match || !title) return [];
    const id = match[1];
    return [{ id: `pg:${id}`, title, authors: value('content') ? [value('content')] : [],
      year: '', pages: '', subjects: [], langs: [], ids: [`Project Gutenberg ${id}`], cover: '',
      desc: 'Project Gutenberg edition. Check the copyright status in your country before downloading.',
      availability: 'Free ebook', links: [{ label: 'Project Gutenberg', url: `https://www.gutenberg.org/ebooks/${id}` }],
      sources: ['Project Gutenberg'] }];
  });
}
