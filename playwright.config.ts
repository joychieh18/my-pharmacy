import { defineConfig } from '@playwright/test';
const executablePath = process.env.PHARMACY_CHROMIUM;
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: 'http://127.0.0.1:4173/my-pharmacy/',
    acceptDownloads: true,
    launchOptions: {
      executablePath,
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/my-pharmacy/',
    timeout: 30000,
  },
});
