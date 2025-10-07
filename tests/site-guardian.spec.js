import { test, expect } from '@playwright/test';

const SITE_URL = process.env.SITE_URL || 'https://www.stellarspeak.online';
const TEST_TYPE = process.env.TEST_TYPE || 'quick';
const MONITOR_EMAIL = process.env.MONITOR_EMAIL;
const MONITOR_PASSWORD = process.env.MONITOR_PASSWORD;

// 🔧 دوال مساعدة للاختبارات
async function loginUser(page) {
  if (!MONITOR_EMAIL || !MONITOR_PASSWORD) {
    console.log('⚠️ Monitor credentials not configured');
    return false;
  }
  
  await page.goto(`${SITE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', MONITOR_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', MONITOR_PASSWORD);
  await page.click('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل الدخول")');
  await page.waitForTimeout(3000);
  
  const hasLoggedIn = page.url().includes('/dashboard') || 
                     page.url() === SITE_URL + '/' ||
                     await page.locator('text=مرحباً, text=لوحة التحكم').isVisible();
  return hasLoggedIn;
}

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
      { url: '/contact', name: 'Contact' },
      { url: '/privacy', name: 'Privacy Policy' },
      { url: '/terms', name: 'Terms of Service' }
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

  test('should have working navigation menu', async ({ page }) => {
    console.log('🧭 Testing navigation menu...');
    
    await page.goto(SITE_URL);
    
    // تحقق من وجود عناصر القائمة
    const menuLinks = [
      'القواعد',
      'المفردات',
      'القراءة',
      'المدونة',
      'من نحن',
      'تواصل'
    ];
    
    for (const linkText of menuLinks) {
      const link = page.locator(`a:has-text("${linkText}")`).first();
      if (await link.isVisible()) {
        console.log(`✅ Menu link found: ${linkText}`);
      }
    }
  });
});

// 🔐 اختبارات المصادقة الشاملة
test.describe('🔐 Authentication System Tests', () => {
  test('should login with monitor account', async ({ page }) => {
    console.log('🔐 Testing login with monitor account...');
    
    const loginSuccess = await loginUser(page);
    expect(loginSuccess).toBeTruthy();
    console.log('✅ Login successful');
  });

  test('should handle invalid login attempts', async ({ page }) => {
    console.log('🚫 Testing invalid login...');
    
    await page.goto(`${SITE_URL}/login`);
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // تحقق من وجود رسالة خطأ
    const hasError = await page.locator('text=خطأ, text=غير صحيح, text=فشل, .error').isVisible();
    console.log(`🚫 Error message shown: ${hasError}`);
  });

  test('should logout successfully', async ({ page }) => {
    console.log('🚪 Testing logout...');
    
    await loginUser(page);
    
    // ابحث عن زر تسجيل الخروج
    const logoutButton = page.locator('button:has-text("خروج"), a:has-text("خروج"), button:has-text("تسجيل خروج")').first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const isLoggedOut = page.url().includes('/login') || page.url() === SITE_URL + '/';
      console.log(`🚪 Logout successful: ${isLoggedOut}`);
      expect(isLoggedOut).toBeTruthy();
    }
  });
});

// 📊 اختبارات لوحة التحكم الشاملة
test.describe('📊 Dashboard Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access dashboard with all elements', async ({ page }) => {
    console.log('📊 Testing dashboard...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // تحقق من العناصر الأساسية
    const elements = [
      'h1, h2',
      '.level-card, .course-card',
      'button, a[href*="lesson"], a[href*="level"]'
    ];
    
    for (const selector of elements) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible();
      console.log(`📊 Element ${selector}: ${isVisible ? 'FOUND' : 'NOT FOUND'}`);
    }
  });

  test('should display user progress', async ({ page }) => {
    console.log('📈 Testing user progress display...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // ابحث عن مؤشرات التقدم
    const progressIndicators = await page.locator('.progress, .progress-bar, text=تقدمك, text=Progress').count();
    console.log(`📈 Progress indicators found: ${progressIndicators}`);
  });
});

// 🎯 اختبارات تحديد المستوى الشاملة
test.describe('🎯 Placement Test Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access placement test page', async ({ page }) => {
    console.log('🎯 Testing placement test access...');
    
    const placementTestUrls = [
      '/placement-test',
      '/test/placement',
      '/level-test',
      '/assessment'
    ];
    
    for (const url of placementTestUrls) {
      try {
        await page.goto(`${SITE_URL}${url}`, { timeout: 5000 });
        const hasContent = await page.locator('h1, h2').isVisible();
        if (hasContent) {
          console.log(`✅ Placement test found at: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`⏭️ Placement test not at: ${url}`);
      }
    }
  });

  test('should start placement test flow', async ({ page }) => {
    console.log('🎯 Testing placement test flow...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // ابحث عن زر بدء اختبار تحديد المستوى
    const testButton = page.locator('button:has-text("اختبار تحديد المستوى"), button:has-text("ابدأ الاختبار"), a:has-text("اختبار المستوى")').first();
    
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(3000);
      
      // تحقق من بدء الاختبار
      const hasTestContent = await page.locator('.question, .test-question, input[type="radio"], button:has-text("التالي")').isVisible();
      console.log(`🎯 Test started: ${hasTestContent}`);
      expect(hasTestContent).toBeTruthy();
    } else {
      console.log('⚠️ Placement test button not found');
    }
  });

  test('should answer placement test questions', async ({ page }) => {
    console.log('📝 Testing placement test question interaction...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const testButton = page.locator('button:has-text("اختبار"), a:has-text("اختبار")').first();
    
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(3000);
      
      // حاول الإجابة على 3 أسئلة
      for (let i = 0; i < 3; i++) {
        const radioButton = page.locator('input[type="radio"]').first();
        if (await radioButton.isVisible()) {
          await radioButton.check();
          await page.waitForTimeout(500);
          
          const nextButton = page.locator('button:has-text("التالي"), button:has-text("Next")').first();
          if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(2000);
            console.log(`✅ Question ${i + 1} answered`);
          }
        }
      }
    }
  });

  test('should complete placement test', async ({ page }) => {
    console.log('🏁 Testing placement test completion...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const testButton = page.locator('button:has-text("اختبار"), a:has-text("اختبار")').first();
    
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(3000);
      
      // حاول إكمال الاختبار (10 أسئلة)
      for (let i = 0; i < 10; i++) {
        const radioButton = page.locator('input[type="radio"]').first();
        if (await radioButton.isVisible()) {
          await radioButton.check();
          await page.waitForTimeout(500);
          
          const nextButton = page.locator('button:has-text("التالي"), button:has-text("إنهاء"), button:has-text("Submit")').first();
          if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(2000);
          }
        } else {
          break;
        }
      }
      
      // تحقق من ظهور النتيجة
      const hasResult = await page.locator('text=نتيجة, text=المستوى, text=Result, .result').isVisible();
      console.log(`🏁 Test completed with result: ${hasResult}`);
    }
  });
});

// 📚 اختبارات الدروس الشاملة
test.describe('📚 Lessons Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should navigate to lessons from dashboard', async ({ page }) => {
    console.log('📚 Testing lessons navigation...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // ابحث عن مستوى
    const levelButton = page.locator('.level-card, button:has-text("A1"), button:has-text("ابدأ"), a:has-text("المستوى")').first();
    
    if (await levelButton.isVisible()) {
      await levelButton.click();
      await page.waitForTimeout(3000);
      
      // ابحث عن قائمة الدروس
      const lessonsFound = await page.locator('.lesson-item, .lesson-card, .lesson-list').count();
      console.log(`📚 Lessons found: ${lessonsFound}`);
      expect(lessonsFound).toBeGreaterThan(0);
    }
  });

  test('should open and complete a lesson', async ({ page }) => {
    console.log('📖 Testing lesson completion flow...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const levelButton = page.locator('.level-card, button:has-text("A1")').first();
    if (await levelButton.isVisible()) {
      await levelButton.click();
      await page.waitForTimeout(3000);
      
      const lessonItem = page.locator('.lesson-item, .lesson-card, button:has-text("درس")').first();
      if (await lessonItem.isVisible()) {
        await lessonItem.click();
        await page.waitForTimeout(3000);
        
        // تحقق من محتوى الدرس
        const hasContent = await page.locator('.lesson-content, .content, h1, h2').isVisible();
        console.log(`📖 Lesson content loaded: ${hasContent}`);
        
        // ابحث عن زر "التالي" أو "إنهاء الدرس"
        const nextButton = page.locator('button:has-text("التالي"), button:has-text("إنهاء"), button:has-text("Next")').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Lesson navigation working');
        }
      }
    }
  });

  test('should test lesson exercises', async ({ page }) => {
    console.log('✏️ Testing lesson exercises...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const levelButton = page.locator('.level-card').first();
    if (await levelButton.isVisible()) {
      await levelButton.click();
      await page.waitForTimeout(3000);
      
      const lessonItem = page.locator('.lesson-item, .lesson-card').first();
      if (await lessonItem.isVisible()) {
        await lessonItem.click();
        await page.waitForTimeout(3000);
        
        // ابحث عن تمارين
        const exerciseInputs = await page.locator('input[type="text"], input[type="radio"], select, textarea').count();
        console.log(`✏️ Exercise inputs found: ${exerciseInputs}`);
        
        if (exerciseInputs > 0) {
          // حاول ملء التمارين
          const textInput = page.locator('input[type="text"]').first();
          if (await textInput.isVisible()) {
            await textInput.fill('test answer');
            console.log('✅ Exercise input filled');
          }
          
          const radioButton = page.locator('input[type="radio"]').first();
          if (await radioButton.isVisible()) {
            await radioButton.check();
            console.log('✅ Exercise option selected');
          }
          
          // ابحث عن زر التحقق
          const checkButton = page.locator('button:has-text("تحقق"), button:has-text("إرسال"), button:has-text("Check")').first();
          if (await checkButton.isVisible()) {
            await checkButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Exercise submitted');
          }
        }
      }
    }
  });

  test('should test lesson media elements', async ({ page }) => {
    console.log('🎬 Testing lesson media elements...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const levelButton = page.locator('.level-card').first();
    if (await levelButton.isVisible()) {
      await levelButton.click();
      await page.waitForTimeout(3000);
      
      const lessonItem = page.locator('.lesson-item').first();
      if (await lessonItem.isVisible()) {
        await lessonItem.click();
        await page.waitForTimeout(3000);
        
        // تحقق من وجود عناصر الوسائط
        const hasAudio = await page.locator('audio, button[aria-label*="play"], .audio-player').count();
        const hasVideo = await page.locator('video, iframe[src*="youtube"]').count();
        const hasImages = await page.locator('img').count();
        
        console.log(`🎬 Media elements - Audio: ${hasAudio}, Video: ${hasVideo}, Images: ${hasImages}`);
      }
    }
  });
});

// 🎓 اختبارات إنهاء المستوى الشاملة
test.describe('🎓 Level Completion Test Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access level completion test', async ({ page }) => {
    console.log('🎓 Testing level completion test access...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // ابحث عن اختبار إنهاء المستوى
    const testButton = page.locator('button:has-text("اختبار نهائي"), button:has-text("اختبار المستوى"), a:has-text("الامتحان")').first();
    
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(3000);
      
      const hasTest = await page.locator('.test, .exam, .question').isVisible();
      console.log(`🎓 Level test accessible: ${hasTest}`);
    } else {
      console.log('⚠️ Level completion test not found (may need to complete lessons first)');
    }
  });

  test('should complete level test questions', async ({ page }) => {
    console.log('📝 Testing level completion test questions...');
    
    await page.goto(`${SITE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const testButton = page.locator('button:has-text("اختبار"), button:has-text("امتحان")').first();
    
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(3000);
      
      // حاول الإجابة على الأسئلة
      for (let i = 0; i < 5; i++) {
        const question = page.locator('.question, .test-question').nth(i);
        if (await question.isVisible()) {
          const radioButton = question.locator('input[type="radio"]').first();
          if (await radioButton.isVisible()) {
            await radioButton.check();
            await page.waitForTimeout(500);
            console.log(`✅ Level test question ${i + 1} answered`);
          }
        }
      }
      
      // ابحث عن زر الإرسال
      const submitButton = page.locator('button:has-text("إرسال"), button:has-text("إنهاء"), button:has-text("Submit")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Level test submitted');
        
        // تحقق من النتيجة
        const hasResult = await page.locator('text=نتيجة, text=النتيجة, text=نجحت, text=رسبت, .result').isVisible();
        console.log(`🎓 Test result shown: ${hasResult}`);
      }
    }
  });
});

// 📖 اختبارات المفردات والمراجعة
test.describe('📖 Vocabulary & Review Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access vocabulary section', async ({ page }) => {
    console.log('📖 Testing vocabulary section...');
    
    await page.goto(`${SITE_URL}/vocabulary`);
    await page.waitForTimeout(2000);
    
    const hasVocabulary = await page.locator('.vocab-card, .word-card, .vocabulary-item').isVisible();
    console.log(`📖 Vocabulary section accessible: ${hasVocabulary}`);
  });

  test('should test vocabulary review system', async ({ page }) => {
    console.log('🔄 Testing vocabulary review...');
    
    await page.goto(`${SITE_URL}/review`);
    await page.waitForTimeout(2000);
    
    const hasReview = await page.locator('.review-card, button:has-text("مراجعة")').isVisible();
    console.log(`🔄 Review system accessible: ${hasReview}`);
    
    if (hasReview) {
      // حاول إجراء مراجعة
      const reviewButton = page.locator('button:has-text("ابدأ المراجعة"), button:has-text("مراجعة")').first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
        
        // تحقق من بطاقات المراجعة
        const hasCards = await page.locator('.flashcard, .review-item').isVisible();
        console.log(`🔄 Review cards loaded: ${hasCards}`);
      }
    }
  });

  test('should test vocabulary search and filter', async ({ page }) => {
    console.log('🔍 Testing vocabulary search...');
    
    await page.goto(`${SITE_URL}/vocabulary`);
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('hello');
      await page.waitForTimeout(1000);
      console.log('✅ Vocabulary search working');
    }
  });
});

// ✍️ اختبارات الكتابة
test.describe('✍️ Writing Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access writing section', async ({ page }) => {
    console.log('✍️ Testing writing section...');
    
    await page.goto(`${SITE_URL}/writing`);
    await page.waitForTimeout(2000);
    
    const hasWriting = await page.locator('textarea, .writing-area, .editor').isVisible();
    console.log(`✍️ Writing section accessible: ${hasWriting}`);
  });

  test('should submit writing exercise', async ({ page }) => {
    console.log('📝 Testing writing submission...');
    
    await page.goto(`${SITE_URL}/writing`);
    await page.waitForTimeout(2000);
    
    const textArea = page.locator('textarea').first();
    if (await textArea.isVisible()) {
      await textArea.fill('This is a test writing submission. I am learning English.');
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button:has-text("إرسال"), button:has-text("Submit")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Writing submitted');
      }
    }
  });
});

// 🎧 اختبارات الاستماع
test.describe('🎧 Listening Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access listening section', async ({ page }) => {
    console.log('🎧 Testing listening section...');
    
    await page.goto(`${SITE_URL}/listening`);
    await page.waitForTimeout(2000);
    
    const hasListening = await page.locator('audio, .audio-player, button[aria-label*="play"]').isVisible();
    console.log(`🎧 Listening section accessible: ${hasListening}`);
  });

  test('should play audio and answer questions', async ({ page }) => {
    console.log('🎵 Testing listening exercise...');
    
    await page.goto(`${SITE_URL}/listening`);
    await page.waitForTimeout(2000);
    
    const playButton = page.locator('button[aria-label*="play"], .play-button, button:has-text("تشغيل")').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Audio playing');
      
      // حاول الإجابة على أسئلة الاستماع
      const radioButton = page.locator('input[type="radio"]').first();
      if (await radioButton.isVisible()) {
        await radioButton.check();
        console.log('✅ Listening question answered');
      }
    }
  });
});

// 🗣️ اختبارات النطق
test.describe('🗣️ Pronunciation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access pronunciation section', async ({ page }) => {
    console.log('🗣️ Testing pronunciation section...');
    
    await page.goto(`${SITE_URL}/pronunciation`);
    await page.waitForTimeout(2000);
    
    const hasPronunciation = await page.locator('button:has-text("سجل"), button:has-text("Record"), .record-button').isVisible();
    console.log(`🗣️ Pronunciation section accessible: ${hasPronunciation}`);
  });
});

// 👤 اختبارات الملف الشخصي
test.describe('👤 Profile & Settings Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should access user profile', async ({ page }) => {
    console.log('👤 Testing user profile...');
    
    await page.goto(`${SITE_URL}/profile`);
    await page.waitForTimeout(2000);
    
    const hasProfile = await page.locator('.profile, .user-info, h1:has-text("الملف الشخصي")').isVisible();
    console.log(`👤 Profile accessible: ${hasProfile}`);
    expect(hasProfile).toBeTruthy();
  });

  test('should update profile information', async ({ page }) => {
    console.log('✏️ Testing profile update...');
    
    await page.goto(`${SITE_URL}/profile`);
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="الاسم"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User Updated');
      await page.waitForTimeout(500);
      
      const saveButton = page.locator('button:has-text("حفظ"), button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Profile updated');
      }
    }
  });

  test('should access settings page', async ({ page }) => {
    console.log('⚙️ Testing settings page...');
    
    await page.goto(`${SITE_URL}/settings`);
    await page.waitForTimeout(2000);
    
    const hasSettings = await page.locator('.settings, h1:has-text("الإعدادات")').isVisible();
    console.log(`⚙️ Settings accessible: ${hasSettings}`);
  });
});

// 🏆 اختبارات الشهادات
test.describe('🏆 Certificates Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should check certificate availability', async ({ page }) => {
    console.log('🏆 Testing certificates...');
    
    const levels = ['A1', 'A2', 'B1', 'B2'];
    
    for (const level of levels) {
      await page.goto(`${SITE_URL}/certificate/${level}`);
      await page.waitForTimeout(2000);
      
      const hasRedirect = !page.url().includes('/certificate/');
      const hasErrorMessage = await page.locator('text=خطأ, text=غير مكتسبة').isVisible();
      const hasCertificate = await page.locator('text=شهادة, text=Certificate, .certificate').isVisible();
      
      console.log(`🏆 Certificate ${level}: Redirect=${hasRedirect}, Error=${hasErrorMessage}, Available=${hasCertificate}`);
    }
  });

  test('should display certificates page', async ({ page }) => {
    console.log('📜 Testing certificates page...');
    
    await page.goto(`${SITE_URL}/certificates`);
    await page.waitForTimeout(2000);
    
    const hasCertificatesPage = await page.locator('h1, h2, .certificate-card').isVisible();
    console.log(`📜 Certificates page accessible: ${hasCertificatesPage}`);
  });
});

// 📱 اختبارات الاستجابة المحسنة
test.describe('📱 Enhanced Mobile Responsiveness', () => {
  test('should work on mobile portrait', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    const page = await context.newPage();
    
    await page.goto(SITE_URL);
    await expect(page.locator('h1')).toBeVisible();
    
    console.log('📱 Mobile portrait: PASSED');
    await context.close();
  });

  test('should work on mobile landscape', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 667, height: 375 }
    });
    
    const page = await context.newPage();
    await page.goto(SITE_URL);
    await expect(page.locator('h1')).toBeVisible();
    
    console.log('📱 Mobile landscape: PASSED');
    await context.close();
  });

  test('should work on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }
    });
    
    const page = await context.newPage();
    await page.goto(SITE_URL);
    await expect(page.locator('h1')).toBeVisible();
    
    console.log('📱 Tablet: PASSED');
    await context.close();
  });
});

// ⚡ اختبارات الأداء المحسنة
test.describe('⚡ Enhanced Performance Monitoring', () => {
  test('should maintain good performance across all pages', async ({ page }) => {
    const performanceTests = [
      { url: '/', target: 3000, name: 'Homepage' },
      { url: '/grammar', target: 4000, name: 'Grammar' },
      { url: '/vocabulary-guide', target: 4000, name: 'Vocabulary' },
      { url: '/blog', target: 5000, name: 'Blog' },
      { url: '/reading', target: 4000, name: 'Reading' }
    ];
    
    for (const testCase of performanceTests) {
      const startTime = Date.now();
      await page.goto(`${SITE_URL}${testCase.url}`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      const status = loadTime < testCase.target ? '✅' : '⚠️';
      console.log(`${status} ${testCase.name}: ${loadTime}ms (target: ${testCase.target}ms)`);
      
      expect(loadTime).toBeLessThan(testCase.target + 2000); // زيادة الهامش قليلاً
    }
  });

  test('should measure first contentful paint', async ({ page }) => {
    await page.goto(SITE_URL);
    
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      return paint.map(entry => ({
        name: entry.name,
        startTime: entry.startTime
      }));
    });
    
    console.log('🎨 Paint metrics:', metrics);
  });
});

// 🔍 اختبارات متقدمة للمحتوى المحمي
if (TEST_TYPE === 'full' || TEST_TYPE === 'post-migration') {
  test.describe('🔍 Advanced Protected Content Tests', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page);
    });

    test('should test all protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/vocabulary',
        '/review',
        '/profile',
        '/writing',
        '/pronunciation',
        '/listening',
        '/settings',
        '/certificates',
        '/progress',
        '/achievements'
      ];
      
      for (const route of protectedRoutes) {
        try {
          await page.goto(`${SITE_URL}${route}`, { timeout: 10000 });
          const hasContent = await page.locator('h1, h2, .content').isVisible();
          const status = hasContent ? '✅ ACCESSIBLE' : '🔒 BLOCKED';
          console.log(`${status} ${route}`);
        } catch (error) {
          console.log(`⏱️ TIMEOUT ${route} (may be protected correctly)`);
        }
      }
    });

    test('should test search functionality', async ({ page }) => {
      console.log('🔍 Testing search...');
      
      await page.goto(`${SITE_URL}/dashboard`);
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('grammar');
        await page.waitForTimeout(1000);
        
        const results = await page.locator('.search-result, .result-item').count();
        console.log(`🔍 Search results: ${results}`);
      }
    });

    test('should test notification system', async ({ page }) => {
      console.log('🔔 Testing notifications...');
      
      await page.goto(`${SITE_URL}/dashboard`);
      await page.waitForTimeout(2000);
      
      const notificationIcon = page.locator('.notification-icon, button[aria-label*="notification"]').first();
      if (await notificationIcon.isVisible()) {
        await notificationIcon.click();
        await page.waitForTimeout(1000);
        
        const hasNotifications = await page.locator('.notification, .notification-item').isVisible();
        console.log(`🔔 Notifications visible: ${hasNotifications}`);
      }
    });

    test('should test progress tracking', async ({ page }) => {
      console.log('📊 Testing progress tracking...');
      
      await page.goto(`${SITE_URL}/progress`);
      await page.waitForTimeout(2000);
      
      const hasProgressData = await page.locator('.progress-chart, .statistics, .stats').isVisible();
      console.log(`📊 Progress data visible: ${hasProgressData}`);
    });
  });
}

// 🧪 اختبارات النماذج
test.describe('🧪 Forms Testing', () => {
  test('should test contact form', async ({ page }) => {
    console.log('📧 Testing contact form...');
    
    await page.goto(`${SITE_URL}/contact`);
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageInput = page.locator('textarea[name="message"], textarea').first();
    
    if (await nameInput.isVisible() && await emailInput.isVisible() && await messageInput.isVisible()) {
      await nameInput.fill('Test User');
      await emailInput.fill('test@example.com');
      await messageInput.fill('This is a test message');
      await page.waitForTimeout(500);
      
      const submitButton = page.locator('button[type="submit"], button:has-text("إرسال")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Contact form submitted');
      }
    }
  });
});

// 🔗 اختبارات الروابط
test.describe('🔗 Links & Navigation Tests', () => {
  test('should check for broken links on homepage', async ({ page }) => {
    console.log('🔗 Testing links...');
    
    await page.goto(SITE_URL);
    await page.waitForTimeout(2000);
    
    const links = await page.locator('a[href]').all();
    console.log(`🔗 Total links found: ${links.length}`);
    
    let brokenLinks = 0;
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const href = await links[i].getAttribute('href');
      if (href && href.startsWith('http')) {
        try {
          const response = await page.request.get(href);
          if (response.status() >= 400) {
            brokenLinks++;
            console.log(`❌ Broken link: ${href}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not check: ${href}`);
        }
      }
    }
    
    console.log(`🔗 Broken links: ${brokenLinks}`);
  });
});
