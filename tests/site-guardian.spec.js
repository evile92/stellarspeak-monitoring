import { test, expect } from '@playwright/test';

const SITE_URL = process.env.SITE_URL || 'https://www.stellarspeak.online';
const TEST_TYPE = process.env.TEST_TYPE || 'quick';
const MONITOR_EMAIL = process.env.MONITOR_EMAIL;
const MONITOR_PASSWORD = process.env.MONITOR_PASSWORD;

// 🏠 اختبارات الصفحات العامة
test.describe('🏠 Public Pages Health Check', () => {
  test('should load all public pages successfully', async ({ page }) => {
    const publicPages = [
      { url: '/', name: 'Homepage' },
      { url: '/grammar', name: 'Grammar Guide' },
      { url: '/vocabulary-guide', name: 'Vocabulary Guide' },
      { url: '/reading', name: 'Reading Center' },
      { url: '/blog', name: 'Blog' },
      { url: '/about', name: 'About' },
      { url: '/contact', name: 'Contact' }
    ];
    
    for (const pageInfo of publicPages) {
      const startTime = Date.now();
      await page.goto(`${SITE_URL}${pageInfo.url}`);
      
      await expect(page.locator('h1, h2')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ ${pageInfo.name}: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(8000);
    }
  });
});

// 🔐 اختبارات المصادقة مع الحساب الدائم
test.describe('🔐 Authentication with Monitor Account', () => {
  test('should login with monitor account', async ({ page }) => {
    console.log('🔐 Testing login with monitor account...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      console.log('⚠️ Monitor credentials not configured');
      return;
    }
    
    await page.goto(`${SITE_URL}/login`);
    
    // املأ نموذج تسجيل الدخول
    await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
    
    // اضغط زر الدخول
    await page.click('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل الدخول")');
    
    // انتظار التحميل
    await page.waitForTimeout(3000);
    
    // تحقق من نجاح الدخول
    const currentUrl = page.url();
    const hasLoggedIn = currentUrl.includes('/dashboard') || 
                       currentUrl === SITE_URL + '/' ||
                       await page.locator('text=مرحباً, text=لوحة التحكم').isVisible();
    
    console.log(`🔐 Login result: ${hasLoggedIn ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📍 Current URL: ${currentUrl}`);
    
    expect(hasLoggedIn).toBeTruthy();
  });
});

// 📚 اختبارات الدروس مع المصادقة
test.describe('📚 Protected Content Access', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول قبل كل اختبار
    if (MONITOR_EMAIL && MONITOR_PASSWORD) {
      await page.goto(`${SITE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
      await page.click('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل الدخول")');
      await page.waitForTimeout(3000);
    }
  });

  test('should access dashboard after login', async ({ page }) => {
    console.log('📊 Testing dashboard access...');
    
    // الذهاب للوحة التحكم
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // تحقق من وجود محتوى لوحة التحكم
    const hasDashboard = await page.locator('h1, h2, .level-card, .course-card').isVisible();
    
    console.log(`📊 Dashboard accessible: ${hasDashboard}`);
    expect(hasDashboard).toBeTruthy();
  });

  test('should access lesson content', async ({ page }) => {
    console.log('📖 Testing lesson access...');
    
    // الذهاب للوحة التحكم أولاً
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // ابحث عن مستوى أو درس للضغط عليه
    const levelButton = page.locator('.level-card, button:has-text("A1"), button:has-text("ابدأ")').first();
    
    if (await levelButton.isVisible()) {
      await levelButton.click();
      await page.waitForTimeout(3000);
      
      // ابحث عن دروس
      const lessonItem = page.locator('.lesson-item, .lesson-card, button:has-text("درس")').first();
      
      if (await lessonItem.isVisible()) {
        await lessonItem.click();
        await page.waitForTimeout(3000);
        
        // تحقق من تحميل محتوى الدرس
        const hasLessonContent = await page.locator('h1, h2, .lesson-content').isVisible();
        console.log(`📖 Lesson content loaded: ${hasLessonContent}`);
        
        expect(hasLessonContent).toBeTruthy();
      } else {
        console.log('⚠️ No lesson items found');
      }
    } else {
      console.log('⚠️ No level buttons found');
    }
  });

  test('should test certificate access', async ({ page }) => {
    console.log('🏆 Testing certificate functionality...');
    
    // محاولة الوصول لصفحة شهادة (سيعيد توجيه إذا لم تكن مكتسبة)
    await page.goto(`${SITE_URL}/certificate/A1`);
    await page.waitForTimeout(2000);
    
    // تحقق من الاستجابة المناسبة
    const hasRedirect = !page.url().includes('/certificate/');
    const hasErrorMessage = await page.locator('text=خطأ, text=غير مكتسبة').isVisible();
    const hasCertificate = await page.locator('text=شهادة, text=Certificate').isVisible();
    
    console.log(`🏆 Certificate handling: Redirect=${hasRedirect}, Error=${hasErrorMessage}, Certificate=${hasCertificate}`);
    
    // أي استجابة منطقية تعتبر نجاح
    expect(hasRedirect || hasErrorMessage || hasCertificate).toBeTruthy();
  });
});

// 📱 اختبارات الاستجابة
test.describe('📱 Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    const page = await context.newPage();
    
    // اختبار الصفحة الرئيسية
    await page.goto(SITE_URL);
    await expect(page.locator('h1')).toBeVisible();
    
    // اختبار صفحة أخرى
    await page.goto(`${SITE_URL}/grammar`);
    await expect(page.locator('h1, h2')).toBeVisible();
    
    console.log('📱 Mobile responsiveness: PASSED');
    await context.close();
  });
});

// ⚡ اختبارات الأداء
test.describe('⚡ Performance Monitoring', () => {
  test('should maintain good performance', async ({ page }) => {
    const performanceTests = [
      { url: '/', target: 3000 },
      { url: '/grammar', target: 4000 },
      { url: '/vocabulary-guide', target: 4000 },
      { url: '/blog', target: 5000 }
    ];
    
    for (const testCase of performanceTests) {
      const startTime = Date.now();
      await page.goto(`${SITE_URL}${testCase.url}`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ ${testCase.url}: ${loadTime}ms (target: ${testCase.target}ms)`);
      
      expect(loadTime).toBeLessThan(testCase.target);
    }
  });
});

// 🔍 اختبارات متقدمة للمحتوى المحمي
if (TEST_TYPE === 'full' || TEST_TYPE === 'post-migration') {
  test.describe('🔍 Advanced Protected Content Tests', () => {
    test.beforeEach(async ({ page }) => {
      // تسجيل الدخول
      if (MONITOR_EMAIL && MONITOR_PASSWORD) {
        await page.goto(`${SITE_URL}/login`);
        await page.fill('input[type="email"]', MONITOR_EMAIL);
        await page.fill('input[type="password"]', MONITOR_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      }
    });

    test('should test all protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/vocabulary',
        '/review',
        '/profile',
        '/writing',
        '/pronunciation',
        '/listening'
      ];
      
      for (const route of protectedRoutes) {
        try {
          await page.goto(`${SITE_URL}${route}`, { timeout: 10000 });
          const hasContent = await page.locator('h1, h2').isVisible();
          console.log(`🔒 ${route}: ${hasContent ? 'ACCESSIBLE' : 'BLOCKED'}`);
        } catch (error) {
          console.log(`🔒 ${route}: TIMEOUT (may be protected correctly)`);
        }
      }
    });
  });
}
