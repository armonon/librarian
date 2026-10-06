import { defineConfig } from 'vite';
import bookText from './netlify/functions/book-text.mjs';

function readingEndpoint(server) {
  server.middlewares.use('/.netlify/functions/book-text', async (req, res, next) => {
    if (req.method !== 'GET') return next();
    try {
      const response = await bookText(new Request(`http://localhost${req.url}`));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch { res.writeHead(502); res.end('Could not retrieve this book.'); }
  });
}

// base: './' → relative asset paths, so the built app loads from any origin:
// the web (served at /), Capacitor iOS (capacitor://localhost), and Electron (file://).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [{ name: 'local-book-reading', configureServer: readingEndpoint, configurePreviewServer: readingEndpoint }],
  // Keep the worker's ?url import as an asset during Vite development.
  optimizeDeps: { exclude: ['pdfjs-dist'] },
  // PDF.js documents Safari support for its polyfilled legacy build.
  resolve: mode === 'ios' ? {
    alias: [
      { find: 'pdfjs-dist/build/pdf.mjs', replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
      { find: 'pdfjs-dist/build/pdf.worker.min.mjs?url', replacement: 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' },
    ],
  } : undefined,
  build: mode === 'ios' ? { target: 'safari18' } : undefined,
}));
