import { defineConfig } from 'vite';

// base: './' → relative asset paths, so the built app loads from any origin:
// the web (served at /), Capacitor iOS (capacitor://localhost), and Electron (file://).
export default defineConfig(({ mode }) => ({
  base: './',
  // PDF.js documents Safari support for its polyfilled legacy build.
  resolve: mode === 'ios' ? {
    alias: [
      { find: 'pdfjs-dist/build/pdf.mjs', replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
      { find: 'pdfjs-dist/build/pdf.worker.min.mjs?url', replacement: 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' },
    ],
  } : undefined,
  build: mode === 'ios' ? { target: 'safari18' } : undefined,
}));
