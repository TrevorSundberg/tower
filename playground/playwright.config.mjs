import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.TOWER_TEST_URL ?? 'http://127.0.0.1:4173';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: '../build/playground-browser-tests',
  timeout: 30000,
  expect: { timeout: 10000 },
  workers: 2,
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // Language tests retain their original Wasm-only selection. Detection tests
    // explicitly start with empty storage instead of depending on the test host.
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [
      { name: 'tower-build-targets-v3', value: '{"wasm":true,"x86":false,"arm":false}' },
    ] }] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 } } },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: baseURL, reuseExistingServer: true },
});
