import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// ORBITA_BROWSER points at an installed Chromium-based browser when Playwright's own build is absent.
const browser = process.env.ORBITA_BROWSER ?? (existsSync(windowsChrome) ? windowsChrome : undefined);
// ORBITA_PORT lets several checkouts run their suites at the same time without sharing a preview server.
const port = Number(process.env.ORBITA_PORT ?? 4173);
export default defineConfig({
  testDir:'./tests/e2e',
  fullyParallel:true,
  // Software WebGL (SwiftShader) is slow; three workers and a 60 s budget keep runs stable on a laptop.
  timeout:60_000,
  workers:3,
  use:{
    ...devices['Desktop Chrome'],
    viewport:{width:1440,height:960},
    // The game picks its first language from the browser; the suites are written against the Spanish interface.
    locale:'es-ES',
    baseURL:`http://127.0.0.1:${port}`,
    launchOptions:{executablePath:browser,args:['--enable-unsafe-swiftshader']},
  },
  webServer:{
    command:`node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url:`http://127.0.0.1:${port}`,
    reuseExistingServer:false,
  },
});
