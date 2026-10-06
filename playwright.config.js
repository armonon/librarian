import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 45000, fullyParallel: true,
  use: { serviceWorkers: 'block', baseURL: 'http://127.0.0.1:4178', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'iPhone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'iPad', use: { ...devices['iPad Pro 11'], browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run build -- --mode ios && npm run preview -- --port 4178', url: 'http://127.0.0.1:4178', reuseExistingServer: true },
});
