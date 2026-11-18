import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: '../build/playground-browser-tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // Language tests retain their original Wasm-only selection. Detection tests
    // explicitly start with empty storage instead of depending on the test host.
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [
      { name: 'tower-build-targets-v1', value: '{"wasm":true,"x86":false,"arm":false}' },
    ] }] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 } } },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
