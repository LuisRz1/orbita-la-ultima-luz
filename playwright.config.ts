import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:true,
  timeout:30_000,
  use:{
    ...devices['Desktop Chrome'],
    viewport:{width:1440,height:960},
    baseURL:'http://127.0.0.1:4173',
    launchOptions:{executablePath:existsSync(windowsChrome)?windowsChrome:undefined},
  },
  webServer:{
    command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
  },
});
