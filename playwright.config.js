import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 15000 },
  
  // Retry settings
  retries: process.env.CI ? 2 : 1,
  
  // Worker settings
  workers: process.env.CI ? 1 : undefined,
  
  // Global timeout
  globalTimeout: 600000, // 10 دقائق
  
  // 🔥 الإصلاح الأساسي - JSON Reporter بشكل صحيح
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // إضافة forbidOnly في CI
  forbidOnly: !!process.env.CI,
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        viewport: { width: 1280, height: 720 },
        
        // Browser launch options
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-gpu'
          ]
        }
      },
    }
  ],
  
  use: {
    baseURL: process.env.SITE_URL || 'https://www.stellarspeak.online',
    
    // Trace and screenshot settings
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // HTTP headers
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    
    // Navigation and action timeouts
    navigationTimeout: 45000,
    actionTimeout: 30000,
    
    // HTTPS errors
    ignoreHTTPSErrors: true
  }
});
