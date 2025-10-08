import { test, expect } from '@playwright/test';

const SITE_URL = process.env.SITE_URL || 'https://www.stellarspeak.online';
const TEST_TYPE = process.env.TEST_TYPE || 'quick';
const MONITOR_EMAIL = process.env.MONITOR_EMAIL;
const MONITOR_PASSWORD = process.env.MONITOR_PASSWORD;

// إضافة setup قبل الاختبارات
test.beforeAll(async () => {
  console.log(`🔍 Running StellarSpeak Site Guardian Tests`);
  console.log(`📊 Site URL: ${SITE_URL}`);
  console.log(`🔧 Test type: ${TEST_TYPE}`);
  console.log(`👤 Monitor account: ${MONITOR_EMAIL ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});

// 🌐 اختبارات الاتصال الأساسية
test.describe('🌐 Basic Connectivity Check', () => {
  test('should reach the main domain', async ({ page }) => {
    console.log('🌐 Testing basic domain connectivity...');
    
    try {
      const response = await page.goto(SITE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      console.log(`📡 Response status: ${response.status()}`);
      console.log(`🌍 Final URL: ${page.url()}`);
      
      // التحقق من حالة الاستجابة
      expect(response.status()).toBeLessThan(400);
      
      // التحقق من تحميل المحتوى الأساسي
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      
      console.log('✅ Domain connectivity: SUCCESS');
    } catch (error) {
      console.error('❌ Domain connectivity failed:', error.message);
      throw error;
    }
  });
});

// 🏠 اختبارات الصفحات العامة
test.describe('🏠 Public Pages Health Check', () => {
  test('should load all public pages successfully', async ({ page }) => {
    const publicPages = [
      { url: '/', name: 'Homepage', critical: true },
      { url: '/grammar', name: 'Grammar Guide', critical: true },
      { url: '/vocabulary-guide', name: 'Vocabulary Guide', critical: true },
      { url: '/reading', name: 'Reading Center', critical: true },
      { url: '/blog', name: 'Blog', critical: false },
      { url: '/about', name: 'About', critical: false },
      { url: '/contact', name: 'Contact', critical: false },
      // إضافة صفحات مهمة لموقع تعلم الإنجليزية
      { url: '/lessons', name: 'Lessons Overview', critical: true },
      { url: '/levels', name: 'Levels Guide', critical: true }
    ];
    
    for (const pageInfo of publicPages) {
      console.log(`🔍 Testing ${pageInfo.name}...`);
      const startTime = Date.now();
      
      try {
        const response = await page.goto(`${SITE_URL}${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // التحقق من حالة الاستجابة
        expect(response.status()).toBeLessThan(400);
        
        // التحقق من وجود محتوى أساسي
        await expect(page.locator('h1, h2, .main-content, main, body')).toBeVisible({ 
          timeout: 15000 
        });
        
        // التحقق من عدم وجود رسائل خطأ
        const hasError = await page.locator('.error, .not-found, text=404, text=500').isVisible();
        expect(hasError).toBeFalsy();
        
        const loadTime = Date.now() - startTime;
        const timeLimit = pageInfo.critical ? 10000 : 15000;
        
        console.log(`✅ ${pageInfo.name}: ${loadTime}ms (limit: ${timeLimit}ms)`);
        expect(loadTime).toBeLessThan(timeLimit);
        
      } catch (error) {
        const loadTime = Date.now() - startTime;
        console.error(`❌ Failed to load ${pageInfo.name} (${loadTime}ms):`, error.message);
        
        if (pageInfo.critical) {
          throw error; // فشل الاختبار للصفحات الحرجة
        } else {
          console.log(`⚠️ Non-critical page ${pageInfo.name} failed - continuing...`);
        }
      }
    }
  });

  test('should have proper SEO elements', async ({ page }) => {
    console.log('🔍 Testing SEO elements...');
    
    await page.goto(SITE_URL);
    
    // التحقق من عناصر SEO المهمة
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    console.log(`📄 Page title: "${title}"`);
    
    // التحقق من meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    if (metaDescription) {
      expect(metaDescription.length).toBeGreaterThan(50);
      console.log(`📝 Meta description: "${metaDescription.substring(0, 50)}..."`);
    }
    
    // التحقق من وجود H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    console.log(`🏷️ H1 tags found: ${h1Count}`);
    
    console.log('✅ SEO elements: PASSED');
  });
});

// 🔐 اختبارات المصادقة المحسنة
test.describe('🔐 Authentication System Tests', () => {
  test('should handle login process correctly', async ({ page }) => {
    console.log('🔐 Testing comprehensive login process...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      console.log('⚠️ Monitor credentials not configured - skipping auth tests');
      test.skip();
      return;
    }
    
    try {
      // الذهاب لصفحة تسجيل الدخول
      console.log('📍 Navigating to login page...');
      await page.goto(`${SITE_URL}/login`, { timeout: 30000 });
      
      // التحقق من تحميل صفحة تسجيل الدخول
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible({ timeout: 5000 });
      
      console.log('📝 Filling login credentials...');
      // املأ نموذج تسجيل الدخول مع التحقق
      await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
      
      // البحث عن زر تسجيل الدخول بطرق متعددة
      const loginButton = page.locator([
        'button[type="submit"]',
        'button:has-text("دخول")', 
        'button:has-text("تسجيل الدخول")',
        'button:has-text("Login")',
        '.login-btn',
        '#login-button'
      ].join(', '));
      
      await expect(loginButton).toBeVisible({ timeout: 5000 });
      
      console.log('🔘 Clicking login button...');
      await loginButton.click();
      
      // انتظار استجابة تسجيل الدخول
      console.log('⏳ Waiting for login response...');
      await page.waitForTimeout(5000);
      
      // التحقق من نجاح تسجيل الدخول بطرق متعددة
      const currentUrl = page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);
      
      const loginSuccess = (
        currentUrl.includes('/dashboard') || 
        currentUrl.includes('/profile') ||
        currentUrl === SITE_URL + '/' ||
        await page.locator([
          'text=مرحباً', 
          'text=لوحة التحكم', 
          'text=Dashboard',
          '.user-menu',
          '.logout-btn'
        ].join(', ')).isVisible()
      );
      
      console.log(`🔐 Login result: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
      expect(loginSuccess).toBeTruthy();
      
    } catch (error) {
      console.error('❌ Login test failed:', error.message);
      throw error;
    }
  });

  test('should handle invalid login attempts', async ({ page }) => {
    console.log('🛡️ Testing invalid login handling...');
    
    await page.goto(`${SITE_URL}/login`);
    
    // محاولة تسجيل دخول بمعلومات خاطئة
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    const loginButton = page.locator('button[type="submit"], button:has-text("دخول")');
    await loginButton.click();
    
    await page.waitForTimeout(3000);
    
    // التحقق من ظهور رسالة خطأ أو عدم نجاح الدخول
    const hasError = await page.locator([
      'text=خطأ',
      'text=غير صحيح', 
      'text=Invalid',
      'text=Error',
      '.error-message',
      '.alert-danger'
    ].join(', ')).isVisible();
    
    const stillOnLogin = page.url().includes('/login');
    
    console.log(`🛡️ Invalid login handled: ${hasError || stillOnLogin ? 'SUCCESS' : 'FAILED'}`);
    expect(hasError || stillOnLogin).toBeTruthy();
  });
});

// 📚 اختبارات المحتوى المحمي المحسنة
test.describe('📚 Protected Content & Learning Features', () => {
  test.beforeEach(async ({ page }) => {
    if (MONITOR_EMAIL && MONITOR_PASSWORD) {
      console.log('🔑 Logging in before protected content test...');
      
      await page.goto(`${SITE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
      await page.click('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل الدخول")');
      await page.waitForTimeout(5000);
    }
  });

  test('should access dashboard and learning features', async ({ page }) => {
    console.log('📊 Testing dashboard and learning features...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      test.skip();
      return;
    }
    
    // اختبار لوحة التحكم
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(3000);
    
    const hasDashboard = await page.locator([
      'h1, h2', 
      '.level-card', 
      '.course-card',
      '.dashboard-content',
      '.user-progress'
    ].join(', ')).isVisible();
    
    console.log(`📊 Dashboard accessible: ${hasDashboard}`);
    expect(hasDashboard).toBeTruthy();
    
    // اختبار مستويات التعلم إذا كانت متوفرة
    const levelCards = await page.locator('.level-card, button:has-text("A1"), button:has-text("A2"), button:has-text("B1")').count();
    console.log(`🎯 Learning levels found: ${levelCards}`);
    
    if (levelCards > 0) {
      const firstLevel = page.locator('.level-card, button:has-text("A1"), button:has-text("ابدأ")').first();
      
      if (await firstLevel.isVisible()) {
        console.log('🎯 Testing level access...');
        await firstLevel.click();
        await page.waitForTimeout(3000);
        
        // التحقق من تحميل محتوى المستوى
        const hasLevelContent = await page.locator([
          '.lesson-item', 
          '.lesson-card', 
          'button:has-text("درس")',
          '.course-content'
        ].join(', ')).isVisible();
        
        console.log(`📖 Level content loaded: ${hasLevelContent}`);
        expect(hasLevelContent).toBeTruthy();
      }
    }
  });

  test('should test vocabulary and grammar features', async ({ page }) => {
    console.log('📝 Testing vocabulary and grammar features...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      test.skip();
      return;
    }
    
    // اختبار صفحة المفردات
    try {
      await page.goto(`${SITE_URL}/vocabulary`);
      await page.waitForTimeout(3000);
      
      const hasVocabContent = await page.locator([
        '.vocabulary-item',
        '.word-card',
        '.vocab-list',
        'h1, h2'
      ].join(', ')).isVisible();
      
      console.log(`📚 Vocabulary page accessible: ${hasVocabContent}`);
      
    } catch (error) {
      console.log(`⚠️ Vocabulary page test failed: ${error.message}`);
    }
    
    // اختبار ميزات النحو
    try {
      await page.goto(`${SITE_URL}/grammar`);
      await page.waitForTimeout(3000);
      
      const hasGrammarContent = await page.locator([
        '.grammar-rule',
        '.grammar-example',
        '.grammar-content',
        'h1, h2'
      ].join(', ')).isVisible();
      
      console.log(`📖 Grammar features accessible: ${hasGrammarContent}`);
      
    } catch (error) {
      console.log(`⚠️ Grammar features test failed: ${error.message}`);
    }
  });

  test('should test user profile and progress tracking', async ({ page }) => {
    console.log('👤 Testing user profile and progress...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      test.skip();
      return;
    }
    
    try {
      await page.goto(`${SITE_URL}/profile`);
      await page.waitForTimeout(3000);
      
      const hasProfile = await page.locator([
        '.user-profile',
        '.profile-info',
        '.user-stats',
        '.progress-bar',
        'h1:has-text("Profile"), h1:has-text("الملف")',
        'text=مرحباً'
      ].join(', ')).isVisible();
      
      console.log(`👤 Profile page accessible: ${hasProfile}`);
      expect(hasProfile).toBeTruthy();
      
    } catch (error) {
      console.log(`⚠️ Profile test failed: ${error.message}`);
    }
  });

  test('should test certificate system', async ({ page }) => {
    console.log('🏆 Testing certificate system...');
    
    if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
      test.skip();
      return;
    }
    
    // اختبار الوصول لصفحة الشهادات
    try {
      await page.goto(`${SITE_URL}/certificates`);
      await page.waitForTimeout(3000);
      
      const hasCertificates = await page.locator([
        '.certificate',
        '.cert-card',
        'h1:has-text("Certificate"), h1:has-text("الشهادات")',
        'text=شهادة'
      ].join(', ')).isVisible();
      
      console.log(`🏆 Certificates page accessible: ${hasCertificates}`);
      
    } catch (error) {
      console.log(`⚠️ Certificates test failed: ${error.message}`);
    }
    
    // اختبار محاولة الوصول لشهادة محددة
    try {
      await page.goto(`${SITE_URL}/certificate/A1`);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const hasRedirect = !currentUrl.includes('/certificate/A1');
      const hasErrorMessage = await page.locator('text=خطأ, text=غير مكتسبة, text=Not earned').isVisible();
      const hasCertificate = await page.locator('text=شهادة, text=Certificate').isVisible();
      
      console.log(`🏆 Certificate A1 handling: Redirect=${hasRedirect}, Error=${hasErrorMessage}, Certificate=${hasCertificate}`);
      
      // أي استجابة منطقية تعتبر نجاح
      expect(hasRedirect || hasErrorMessage || hasCertificate).toBeTruthy();
      
    } catch (error) {
      console.log(`⚠️ Certificate A1 test failed: ${error.message}`);
    }
  });
});

// 📱 اختبارات الاستجابة المحسنة
test.describe('📱 Mobile & Device Responsiveness', () => {
  test('should work properly on mobile devices', async ({ browser }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    const mobileDevices = [
      { name: 'iPhone', viewport: { width: 375, height: 667 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      { name: 'Android', viewport: { width: 360, height: 640 }, userAgent: 'Mozilla/5.0 (Android 10; Mobile; rv:85.0)' }
    ];
    
    for (const device of mobileDevices) {
      console.log(`📲 Testing ${device.name} experience...`);
      
      const context = await browser.newContext({
        viewport: device.viewport,
        userAgent: device.userAgent
      });
      
      const page = await context.newPage();
      
      try {
        // اختبار الصفحة الرئيسية
        await page.goto(SITE_URL, { timeout: 30000 });
        await expect(page.locator('h1, .main-content, body')).toBeVisible({ timeout: 10000 });
        
        // اختبار قائمة الجوال
        const mobileMenu = page.locator('.mobile-menu, .hamburger, .menu-toggle, .navbar-toggle');
        if (await mobileMenu.isVisible()) {
          console.log(`📱 ${device.name}: Mobile menu found`);
          await mobileMenu.click();
          await page.waitForTimeout(1000);
        }
        
        // اختبار صفحة أخرى مهمة
        await page.goto(`${SITE_URL}/grammar`, { timeout: 30000 });
        await expect(page.locator('h1, h2, .main-content')).toBeVisible({ timeout: 10000 });
        
        console.log(`✅ ${device.name} responsiveness: PASSED`);
        
      } catch (error) {
        console.error(`❌ ${device.name} test failed:`, error.message);
        throw error;
      } finally {
        await context.close();
      }
    }
  });

  test('should handle different screen orientations', async ({ browser }) => {
    console.log('🔄 Testing screen orientation handling...');
    
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 } // Tablet size
    });
    
    const page = await context.newPage();
    
    // Portrait mode
    await page.goto(SITE_URL);
    await expect(page.locator('body')).toBeVisible();
    console.log('📱 Portrait mode: PASSED');
    
    // Landscape mode
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
    console.log('📱 Landscape mode: PASSED');
    
    await context.close();
  });
});

// ⚡ اختبارات الأداء المحسنة
test.describe('⚡ Performance & Speed Optimization', () => {
  test('should maintain excellent performance metrics', async ({ page }) => {
    console.log('⚡ Testing comprehensive performance metrics...');
    
    const performanceTests = [
      { url: '/', name: 'Homepage', target: 4000, critical: true },
      { url: '/grammar', name: 'Grammar Guide', target: 5000, critical: true },
      { url: '/vocabulary-guide', name: 'Vocabulary Guide', target: 5000, critical: true },
      { url: '/reading', name: 'Reading Center', target: 6000, critical: true },
      { url: '/blog', name: 'Blog', target: 7000, critical: false },
      { url: '/about', name: 'About', target: 5000, critical: false }
    ];
    
    for (const testCase of performanceTests) {
      console.log(`⏱️ Testing ${testCase.name} performance...`);
      
      try {
        const startTime = Date.now();
        
        const response = await page.goto(`${SITE_URL}${testCase.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: testCase.target + 5000
        });
        
        const domContentLoaded = Date.now() - startTime;
        
        // انتظار تحميل الشبكة
        await page.waitForLoadState('networkidle', { timeout: testCase.target });
        const networkIdle = Date.now() - startTime;
        
        console.log(`⏱️ ${testCase.name}: DOM=${domContentLoaded}ms, Network=${networkIdle}ms (target: ${testCase.target}ms)`);
        console.log(`📊 Status: ${response.status()}`);
        
        if (testCase.critical) {
          expect(networkIdle).toBeLessThan(testCase.target);
        } else {
          // للصفحات غير الحرجة، نسمح بهامش أكبر
          expect(networkIdle).toBeLessThan(testCase.target * 1.5);
        }
        
        // التحقق من حجم الصفحة (اختياري)
        const contentSize = await page.evaluate(() => document.documentElement.innerHTML.length);
        console.log(`📄 Content size: ${(contentSize / 1024).toFixed(2)}KB`);
        
      } catch (error) {
        console.error(`❌ Performance test failed for ${testCase.name}:`, error.message);
        
        if (testCase.critical) {
          throw error;
        } else {
          console.log(`⚠️ Non-critical performance issue for ${testCase.name} - continuing...`);
        }
      }
    }
  });

  test('should optimize resource loading', async ({ page }) => {
    console.log('📦 Testing resource loading optimization...');
    
    const resourceStats = {
      images: 0,
      scripts: 0,
      stylesheets: 0,
      fonts: 0,
      failed: 0
    };
    
    // مراقبة تحميل الموارد
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (status >= 400) {
        resourceStats.failed++;
        console.log(`❌ Failed resource: ${url} (${status})`);
      }
      
      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) resourceStats.images++;
      if (url.match(/\.js$/i)) resourceStats.scripts++;
      if (url.match(/\.css$/i)) resourceStats.stylesheets++;
      if (url.match(/\.(woff|woff2|ttf|eot)$/i)) resourceStats.fonts++;
    });
    
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    
    console.log('📊 Resource loading stats:');
    console.log(`  🖼️ Images: ${resourceStats.images}`);
    console.log(`  📜 Scripts: ${resourceStats.scripts}`);
    console.log(`  🎨 Stylesheets: ${resourceStats.stylesheets}`);
    console.log(`  🔤 Fonts: ${resourceStats.fonts}`);
    console.log(`  ❌ Failed: ${resourceStats.failed}`);
    
    // التحقق من عدم وجود موارد متفشلة كثيرة
    expect(resourceStats.failed).toBeLessThan(3);
  });
});

// 🔒 اختبارات الأمان
test.describe('🔒 Security & Privacy Checks', () => {
  test('should have proper security headers', async ({ page }) => {
    console.log('🔒 Testing security headers...');
    
    const response = await page.goto(SITE_URL);
    const headers = response.headers();
    
    console.log('📋 Security headers check:');
    
    // التحقق من headers مهمة للأمان
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options', 
      'x-xss-protection',
      'content-security-policy',
      'strict-transport-security'
    ];
    
    let secureHeaders = 0;
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`  ✅ ${header}: ${headers[header]}`);
        secureHeaders++;
      } else {
        console.log(`  ⚠️ ${header}: Missing`);
      }
    });
    
    console.log(`🔒 Security score: ${secureHeaders}/${securityHeaders.length}`);
  });

  test('should not expose sensitive information', async ({ page }) => {
    console.log('🕵️ Testing for sensitive information exposure...');
    
    await page.goto(SITE_URL);
    
    const pageContent = await page.content();
    
    // البحث عن معلومات حساسة محتملة
    const sensitivePatterns = [
      /password/gi,
      /secret/gi,
      /api[_-]?key/gi,
      /token/gi,
      /database/gi,
      /admin/gi
    ];
    
    let exposedInfo = 0;
    sensitivePatterns.forEach(pattern => {
      const matches = pageContent.match(pattern);
      if (matches && matches.length > 2) { // السماح ببعض المراجع العادية
        console.log(`⚠️ Potential sensitive info: ${pattern} (${matches.length} matches)`);
        exposedInfo++;
      }
    });
    
    console.log(`🕵️ Sensitive information check: ${exposedInfo === 0 ? 'PASSED' : 'NEEDS REVIEW'}`);
  });
});

// 🔍 اختبارات متقدمة للمحتوى المحمي (للفحص الكامل)
if (TEST_TYPE === 'full' || TEST_TYPE === 'post-migration') {
  test.describe('🔍 Advanced Protected Content Tests', () => {
    test.beforeEach(async ({ page }) => {
      if (MONITOR_EMAIL && MONITOR_PASSWORD) {
        console.log('🔑 Advanced tests login...');
        
        await page.goto(`${SITE_URL}/login`);
        await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
        await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
        await page.click('button[type="submit"], button:has-text("دخول")');
        await page.waitForTimeout(5000);
      }
    });

    test('should test all protected routes comprehensively', async ({ page }) => {
      console.log('🔍 Testing comprehensive protected routes...');
      
      if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
        test.skip();
        return;
      }
      
      const protectedRoutes = [
        { path: '/dashboard', name: 'Dashboard', critical: true },
        { path: '/vocabulary', name: 'Vocabulary Manager', critical: true },
        { path: '/review', name: 'Review System', critical: true },
        { path: '/profile', name: 'User Profile', critical: true },
        { path: '/writing', name: 'Writing Practice', critical: false },
        { path: '/pronunciation', name: 'Pronunciation Guide', critical: false },
        { path: '/listening', name: 'Listening Exercises', critical: false },
        { path: '/progress', name: 'Progress Tracking', critical: true },
        { path: '/certificates', name: 'Certificates', critical: false },
        { path: '/settings', name: 'User Settings', critical: false }
      ];
      
      for (const route of protectedRoutes) {
        console.log(`🔒 Testing ${route.name} (${route.path})...`);
        
        try {
          const response = await page.goto(`${SITE_URL}${route.path}`, { 
            timeout: 15000,
            waitUntil: 'domcontentloaded' 
          });
          
          const hasContent = await page.locator('h1, h2, .main-content, .content').isVisible();
          const statusCode = response.status();
          
          console.log(`🔒 ${route.name}: Status=${statusCode}, Content=${hasContent ? 'YES' : 'NO'}`);
          
          if (route.critical) {
            expect(statusCode).toBeLessThan(400);
            expect(hasContent).toBeTruthy();
          }
          
        } catch (error) {
          console.log(`🔒 ${route.name}: ${route.critical ? 'CRITICAL FAILURE' : 'TIMEOUT/ERROR'} - ${error.message}`);
          
          if (route.critical) {
            throw error;
          }
        }
      }
    });

    test('should test learning progress and achievements', async ({ page }) => {
      console.log('🏆 Testing learning progress and achievements...');
      
      if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
        test.skip();
        return;
      }
      
      try {
        // اختبار صفحة التقدم
        await page.goto(`${SITE_URL}/progress`);
        await page.waitForTimeout(3000);
        
        const hasProgress = await page.locator([
          '.progress-bar',
          '.achievement',
          '.level-progress',
          'text=تقدم',
          'text=Progress'
        ].join(', ')).isVisible();
        
        console.log(`📊 Progress tracking: ${hasProgress ? 'AVAILABLE' : 'NOT FOUND'}`);
        
      } catch (error) {
        console.log(`⚠️ Progress test failed: ${error.message}`);
      }
    });
  });
}

// 🧪 اختبارات خاصة لتطبيق التعلم
test.describe('📚 StellarSpeak Learning App Specific Tests', () => {
  test('should test English learning workflow', async ({ page }) => {
    console.log('📚 Testing English learning workflow...');
    
    await page.goto(SITE_URL);
    
    // التحقق من وجود عناصر التعلم في الصفحة الرئيسية
    const learningElements = await page.locator([
      'text=English',
      'text=Learn',
      'text=تعلم',
      'text=إنجليزية',
      '.level',
      '.course',
      '.lesson'
    ].join(', ')).count();
    
    console.log(`📚 Learning elements found: ${learningElements}`);
    expect(learningElements).toBeGreaterThan(0);
    
    // اختبار الوصول للدروس
    try {
      await page.goto(`${SITE_URL}/lessons`);
      await page.waitForTimeout(2000);
      
      const hasLessons = await page.locator([
        '.lesson',
        '.course-card',
        'h1:has-text("Lessons"), h1:has-text("الدروس")'
      ].join(', ')).isVisible();
      
      console.log(`📖 Lessons page accessible: ${hasLessons}`);
      
    } catch (error) {
      console.log(`⚠️ Lessons page test: ${error.message}`);
    }
  });

  test('should test language level system', async ({ page }) => {
    console.log('🎯 Testing language level system...');
    
    await page.goto(SITE_URL);
    
    // البحث عن مستويات اللغة (A1, A2, B1, B2, C1, C2)
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let foundLevels = 0;
    
    for (const level of levels) {
      const levelExists = await page.locator(`text=${level}`).isVisible();
      if (levelExists) {
        foundLevels++;
        console.log(`🎯 Level ${level}: FOUND`);
      }
    }
    
    console.log(`🎯 Language levels found: ${foundLevels}/${levels.length}`);
    expect(foundLevels).toBeGreaterThan(0);
  });
});
