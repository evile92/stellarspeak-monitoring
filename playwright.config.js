import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // زيادة timeout للاختبارات
  expect: { timeout: 15000 }, // زيادة timeout للتوقعات
  
  // إضافة retry للاختبارات المتفشلة
  retries: process.env.CI ? 2 : 1,
  
  // تشغيل الاختبارات بشكل متسلسل في CI
  workers: process.env.CI ? 1 : undefined,
  
  // إضافة global setup/teardown
  globalTimeout: 300000, // 5 دقائق للتشغيل الكامل
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        // إضافة viewport واضح
        viewport: { width: 1280, height: 720 },
        
        // تحسين إعدادات المتصفح للـ CI
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
    }
  ],
  
  reporter: [
    // إضافة line reporter للـ CI
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // تصحيح مسار JSON - يجب أن يكون test-results.json مباشرة
    ['json', { outputFile: 'test-results.json' }],
    ['list', { printSteps: true }]
  ],
  
  use: {
    baseURL: process.env.SITE_URL || 'https://www.stellarspeak.online',
    
    // تحسين إعدادات التتبع والتسجيل
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // إضافة headers لتجنب blocking
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    
    // تحسين إعدادات التنقل
    navigationTimeout: 45000, // 45 ثانية للتنقل
    actionTimeout: 30000, // 30 ثانية للإجراءات
    
    // إضافة معالجة للأخطاء الشائعة
    ignoreHTTPSErrors: true, // تجاهل أخطاء SSL في بيئة التطوير
    
    // تحسين إعدادات الشبكة
    contextOptions: {
      // تجاهل أخطاء الشبكة الثانوية
      ignoreDefaultArgs: ['--disable-extensions'],
      
      // إضافة timeout للسياق
      timeout: 60000
    }
  },
  
  // إضافة إعدادات خاصة بـ CI
  ...(process.env.CI && {
    forbidOnly: true, // منع استخدام test.only في CI
    retries: 2, // إعادة المحاولة مرتين
    workers: 1, // عامل واحد فقط
    
    // إعدادات إضافية للـ Container
    use: {
      // تجاوز الإعدادات الافتراضية في Container
      launchOptions: {
        executablePath: '/ms/playwright/chromium-1134/chrome-linux/chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-gpu',
          '--single-process'
        ]
      }
    }
  }),
  
  // إضافة web server للاختبار المحلي (اختياري)
  webServer: process.env.CI ? undefined : {
    command: 'echo "Using remote server: $SITE_URL"',
    url: process.env.SITE_URL || 'https://www.stellarspeak.online',
    reuseExistingServer: true,
    timeout: 10000
  }
});
