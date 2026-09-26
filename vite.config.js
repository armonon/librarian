import { defineConfig } from 'vite';

// base: './' → relative asset paths, so the built app loads from any origin:
// the web (served at /), Capacitor iOS (capacitor://localhost), and Electron (file://).
export default defineConfig({
  base: './',
});
