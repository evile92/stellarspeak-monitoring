import { test, expect } from '@playwright/test';

const SITE_URL = process.env.SITE_URL || 'https://www.stellarspeak.online';
const TEST_TYPE = process.env.TEST_TYPE || 'quick';

// 🏠 اختبارات الصفحة الرئيسية
test.describe('🏠 Homepage & Core Routes', () => {
  test('should load homepage successfully', async ({ page }) => {
    console.log('🔍 Testing homepage...');
    const startTime = Date.now();
    
    await page.goto(SITE_URL);
    await expect(page).toHaveTitle(/StellarSpeak|تعلم الإنجليزية/);
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Homepage loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto(SITE_URL);
    
    // اختبار الروابط الأساسية
    const links = [
      'دليل القواعد',
      'المفردات',
      'مركز القراءة',
      'المدونة'
    ];
    
    for (const linkText of links) {
      const link = page.locator(`text="${linkText}"`).first();
      if (await link.isVisible()) {
        console.log(`✅ Found link: ${linkText}`);
      } else {
        console.log(`⚠️ Missing link: ${linkText}`);
      }
    }
  });
});

// 📚 اختبارات الدروس (Router Migration Critical)
test.describe('📚 Lessons & Learning Flow', () => {
  test('should handle lesson routes correctly', async ({ page }) => {
    // اختبار صفحة الدروس
    await page.goto(`${SITE_URL}/lessons`, { waitUntil: 'networkidle' });
    
    // تأكد من أن الصفحة تحمل بدون خطأ 500
    const hasError = await page.locator('text=خطأ').isVisible();
    const hasContent = await page.locator('h1').isVisible();
    
    console.log(`📚 Lessons page - Has error: ${hasError}, Has content: ${hasContent}`);
    expect(hasError).toBeFalsy();
  });
  
  test('should handle direct lesson URL', async ({ page }) => {
    // اختبار الوصول المباشر لرابط درس
    const response = await page.goto(`${SITE_URL}/lesson/A1-1`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    // تأكد من أن الاستجابة ليست خطأ 500
    console.log(`🔗 Direct lesson URL response: ${response?.status()}`);
    expect(response?.status()).not.toBe(500);
  });
});

// 📱 اختبارات الاستجابة
test.describe('📱 Responsive Design', () => {
  test('should work on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    const page = await context.newPage();
    await page.goto(SITE_URL);
    
    await expect(page.locator('h1')).toBeVisible();
    console.log('📱 Mobile test passed');
    
    await context.close();
  });
});

// 🔍 اختبار الأداء
test.describe('⚡ Performance Tests', () => {
  test('should load key pages quickly', async ({ page }) => {
    const pages = ['/', '/grammar', '/vocabulary-guide', '/blog'];
    
    for (const url of pages) {
      const startTime = Date.now();
      await page.goto(`${SITE_URL}${url}`, { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️ ${url} loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // 10 ثوان كحد أقصى
    }
  });
});

// 🚀 اختبارات Post-Migration الخاصة
if (TEST_TYPE === 'post-migration') {
  test.describe('🚀 Post-Router Migration Tests', () => {
    test('should test all critical routes without errors', async ({ page }) => {
      const routes = [
        '/',
        '/dashboard', 
        '/grammar',
        '/vocabulary-guide',
        '/reading',
        '/blog',
        '/contact',
        '/about',
        '/login',
        '/register'
      ];
      
      for (const route of routes) {
        console.log(`🔍 Testing route: ${route}`);
        const response = await page.goto(`${SITE_URL}${route}`, { 
          timeout: 15000,
          waitUntil: 'domcontentloaded' 
        });
        
        // تأكد من عدم وجود خطأ 500
        expect(response?.status()).not.toBe(500);
        console.log(`✅ ${route} - Status: ${response?.status()}`);
      }
    });
  });
}
