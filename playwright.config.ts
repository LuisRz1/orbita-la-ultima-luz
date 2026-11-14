import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// ORBITA_BROWSER points at an installed Chromium-based browser when Playwright's own build is absent.
const browser = process.env.ORBITA_BROWSER ?? (existsSync(windowsChrome) ? windowsChrome : undefined);
export default defineConfig({
  testDir:'./tests/e2e',
  fullyParallel:true,
  // Software WebGL (SwiftShader) is slow; three workers and a 60 s budget keep runs stable on a laptop.
  timeout:60_000,
  workers:3,
  use:{
    ...devices['Desktop Chrome'],
    viewport:{width:1440,height:960},
    baseURL:'http://127.0.0.1:4173',
    launchOptions:{executablePath:browser,args:['--enable-unsafe-swiftshader']},
  },
  webServer:{
    command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
  },
});
