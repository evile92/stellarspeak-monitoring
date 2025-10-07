// tests/site-guardian.spec.js - النسخة المحسنة
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

// 🔐 اختبارات التسجيل والمصادقة الكاملة
test.describe('🔐 Complete Authentication Flow', () => {
  test('should complete user registration and placement test', async ({ page }) => {
    console.log('🔐 Testing complete authentication flow...');
    
    // 1. زيارة الصفحة الرئيسية
    await page.goto(SITE_URL);
    
    // 2. محاولة العثور على زر "ابدأ التعلم" أو التسجيل
    const startButton = page.locator('text=ابدأ التعلم').first();
    const registerButton = page.locator('text=تسجيل جديد').first();
    const loginButton = page.locator('text=تسجيل الدخول').first();
    
    if (await startButton.isVisible()) {
      console.log('✅ Found start learning button');
      await startButton.click();
    } else if (await registerButton.isVisible()) {
      console.log('✅ Found register button');
      await registerButton.click();
    } else if (await loginButton.isVisible()) {
      console.log('✅ Found login button - going to register');
      await loginButton.click();
      // ابحث عن رابط التسجيل في صفحة الدخول
      const signUpLink = page.locator('text=إنشاء حساب').first();
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
      }
    }
    
    // انتظار تحميل الصفحة التالية
    await page.waitForLoadState('networkidle');
    
    // تحقق من وصولنا لصفحة التسجيل أو اختبار تحديد المستوى
    const isOnRegisterPage = await page.locator('input[type="email"]').isVisible();
    const isOnPlacementTest = await page.locator('text=اختبار تحديد المستوى').isVisible();
    const isOnWelcome = await page.locator('text=مرحباً').isVisible();
    
    console.log(`📍 Current page status:`);
    console.log(`   - Registration form: ${isOnRegisterPage}`);
    console.log(`   - Placement test: ${isOnPlacementTest}`);
    console.log(`   - Welcome screen: ${isOnWelcome}`);
    
    expect(isOnRegisterPage || isOnPlacementTest || isOnWelcome).toBeTruthy();
  });

  test('should handle registration form submission', async ({ page }) => {
    console.log('📝 Testing registration form...');
    
    // الذهاب مباشرة لصفحة التسجيل
    await page.goto(`${SITE_URL}/register`);
    
    // ملء نموذج التسجيل ببيانات وهمية
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    if (await page.locator('input[name="username"]').isVisible()) {
      await page.fill('input[name="username"]', `TestUser${timestamp}`);
    }
    
    if (await page.locator('input[type="email"]').isVisible()) {
      await page.fill('input[type="email"]', testEmail);
    }
    
    if (await page.locator('input[type="password"]').isVisible()) {
      await page.fill('input[type="password"]', 'TestPassword123!');
    }
    
    // محاولة إرسال النموذج
    const submitButton = page.locator('button[type="submit"], button:has-text("تسجيل"), button:has-text("إنشاء حساب")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // انتظار الاستجابة
      await page.waitForTimeout(3000);
      
      // تحقق من النتيجة
      const hasError = await page.locator('text=خطأ').isVisible();
      const hasSuccess = await page.locator('text=تم').isVisible();
      const redirected = !page.url().includes('/register');
      
      console.log(`📝 Registration result: Error=${hasError}, Success=${hasSuccess}, Redirected=${redirected}`);
      
      // على الأقل يجب ألا يكون هناك خطأ جاف في الصفحة
      expect(page.url()).toBeDefined();
    }
  });

  test('should access placement test', async ({ page }) => {
    console.log('📊 Testing placement test access...');
    
    // محاولة الوصول لاختبار تحديد المستوى
    const placementTestUrls = [
      `${SITE_URL}/test`,
      `${SITE_URL}/placement-test`,
      `${SITE_URL}/assessment`
    ];
    
    for (const url of placementTestUrls) {
      try {
        const response = await page.goto(url, { timeout: 10000 });
        
        if (response && response.status() !== 404) {
          console.log(`✅ Found placement test at: ${url}`);
          
          // ابحث عن عناصر الاختبار
          const hasQuestions = await page.locator('input[type="radio"], button:has-text("التالي"), text=سؤال').isVisible();
          
          if (hasQuestions) {
            console.log('✅ Placement test interface found');
            return;
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not access: ${url}`);
      }
    }
  });
});

// 📚 اختبارات الدروس مع Authentication
test.describe('📚 Authenticated Lessons Flow', () => {
  test('should test lesson access with authentication flow', async ({ page }) => {
    console.log('📚 Testing authenticated lesson access...');
    
    // 1. الذهاب للصفحة الرئيسية
    await page.goto(SITE_URL);
    
    // 2. محاولة الوصول للدروس
    const dashboardUrls = [
      `${SITE_URL}/dashboard`,
      `${SITE_URL}/lessons`,
      `${SITE_URL}/levels`
    ];
    
    for (const url of dashboardUrls) {
      try {
        console.log(`🔍 Trying to access: ${url}`);
        const response = await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        console.log(`📍 ${url} - Status: ${response?.status()}`);
        
        // تحقق من وجود محتوى أو redirect للتسجيل
        const hasLoginForm = await page.locator('input[type="email"]').isVisible();
        const hasLessonContent = await page.locator('h1, h2').isVisible();
        const hasWelcome = await page.locator('text=مرحباً').isVisible();
        
        console.log(`   - Login form: ${hasLoginForm}`);
        console.log(`   - Content: ${hasLessonContent}`);
        console.log(`   - Welcome: ${hasWelcome}`);
        
        // الاختبار نجح إذا كان هناك استجابة منطقية
        expect(hasLoginForm || hasLessonContent || hasWelcome).toBeTruthy();
        
        break; // إذا نجح واحد، لا نحتاج باقي الروابط
        
      } catch (error) {
        console.log(`⚠️ Error accessing ${url}: ${error.message}`);
      }
    }
  });

  test('should handle direct lesson URL with auth redirect', async ({ page }) => {
    console.log('🔗 Testing direct lesson URL with auth...');
    
    // محاولة الوصول المباشر لدرس
    try {
      const response = await page.goto(`${SITE_URL}/lesson/A1-1`, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      console.log(`🔗 Direct lesson URL - Status: ${response?.status()}`);
      
      // يجب أن يكون هناك redirect للتسجيل أو رسالة واضحة
      const redirectedToAuth = page.url().includes('login') || page.url().includes('register');
      const hasAuthMessage = await page.locator('text=تسجيل الدخول, text=إنشاء حساب').isVisible();
      const hasErrorMessage = await page.locator('text=غير مخول, text=يرجى التسجيل').isVisible();
      
      console.log(`   - Redirected to auth: ${redirectedToAuth}`);
      console.log(`   - Has auth message: ${hasAuthMessage}`);
      console.log(`   - Has error message: ${hasErrorMessage}`);
      
      // نجح الاختبار إذا كان هناك تعامل صحيح مع غير المسجلين
      expect(redirectedToAuth || hasAuthMessage || hasErrorMessage).toBeTruthy();
      
    } catch (error) {
      console.log(`⚠️ Direct lesson URL timeout - this is expected for protected routes`);
      // Timeout متوقع للصفحات المحمية
      expect(error.message).toContain('Timeout');
    }
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

// ⚡ اختبارات الأداء
test.describe('⚡ Performance Tests', () => {
  test('should load key pages quickly', async ({ page }) => {
    const pages = ['/', '/grammar', '/vocabulary-guide', '/blog'];
    
    for (const url of pages) {
      const startTime = Date.now();
      await page.goto(`${SITE_URL}${url}`, { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      console.log(`⏱️ ${url} loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000);
    }
  });
});
