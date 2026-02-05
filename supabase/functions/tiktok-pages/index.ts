import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Cairo', sans-serif;
    background: linear-gradient(135deg, #01411C 0%, #065f41 50%, #01411C 100%);
    min-height: 100vh;
    color: #ffffff;
    direction: rtl;
  }
  
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .logo {
    font-size: 2.5rem;
    font-weight: 700;
    color: #D4AF37;
    margin-bottom: 10px;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.8);
  }
  
  .card {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 20px;
    border: 1px solid rgba(212,175,55,0.3);
  }
  
  h1 {
    color: #D4AF37;
    font-size: 1.8rem;
    margin-bottom: 20px;
    text-align: center;
  }
  
  h2 {
    color: #D4AF37;
    font-size: 1.3rem;
    margin: 25px 0 15px;
  }
  
  p, li {
    line-height: 1.8;
    margin-bottom: 12px;
    color: rgba(255,255,255,0.9);
  }
  
  ul {
    padding-right: 25px;
  }
  
  .nav-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
  }
  
  .nav-links a {
    color: #D4AF37;
    text-decoration: none;
    padding: 10px 20px;
    border: 1px solid #D4AF37;
    border-radius: 8px;
    transition: all 0.3s;
  }
  
  .nav-links a:hover {
    background: #D4AF37;
    color: #01411C;
  }
  
  .footer {
    text-align: center;
    margin-top: 40px;
    padding: 20px;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
  }
  
  .badge {
    display: inline-block;
    background: #D4AF37;
    color: #01411C;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .english-section {
    direction: ltr;
    text-align: left;
    margin-top: 40px;
    padding-top: 30px;
    border-top: 1px solid rgba(212,175,55,0.3);
  }

  .english-section ul {
    padding-left: 25px;
    padding-right: 0;
  }
`;

const homePage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wasata AI - TikTok Integration</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">وساطة AI</div>
      <div class="subtitle">منصة الوساطة العقارية الذكية</div>
    </div>
    
    <div class="card">
      <span class="badge">TikTok Integration</span>
      <h1>مرحباً بك في وساطة AI</h1>
      <p>
        وساطة AI هي منصة متكاملة للوساطة العقارية تستخدم الذكاء الاصطناعي لتسهيل عمليات البيع والشراء والتأجير العقاري في المملكة العربية السعودية.
      </p>
      <p>
        من خلال تكامل TikTok، يمكنك نشر عروضك العقارية مباشرة على TikTok والوصول لجمهور أوسع.
      </p>
      
      <h2>المميزات:</h2>
      <ul>
        <li>نشر الفيديوهات العقارية مباشرة على TikTok</li>
        <li>إدارة المحتوى من مكان واحد</li>
        <li>تحليلات ذكية للأداء</li>
        <li>توليد هاشتاقات تلقائية</li>
      </ul>
    </div>
    
    <div class="nav-links">
      <a href="/terms">شروط الاستخدام</a>
      <a href="/privacy">سياسة الخصوصية</a>
      <a href="https://wasataai.com" target="_blank">زيارة الموقع الرئيسي</a>
    </div>
    
    <div class="footer">
      <p>© 2025 Wasata AI. جميع الحقوق محفوظة.</p>
      <p>Kingdom of Saudi Arabia</p>
    </div>
  </div>
</body>
</html>
`;

const termsPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شروط الاستخدام - Wasata AI</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">وساطة AI</div>
      <div class="subtitle">شروط الاستخدام</div>
    </div>
    
    <div class="card">
      <h1>شروط الاستخدام</h1>
      <p><strong>تاريخ السريان:</strong> 1 يناير 2025</p>
      
      <h2>1. القبول بالشروط</h2>
      <p>باستخدامك لتطبيق وساطة AI ومميزات تكامل TikTok، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
      
      <h2>2. وصف الخدمة</h2>
      <p>توفر وساطة AI منصة للوساطة العقارية تتضمن:</p>
      <ul>
        <li>إدارة العروض العقارية</li>
        <li>نشر المحتوى على منصات التواصل الاجتماعي بما فيها TikTok</li>
        <li>أدوات الذكاء الاصطناعي للمساعدة</li>
        <li>إدارة العملاء والمواعيد</li>
      </ul>
      
      <h2>3. استخدام تكامل TikTok</h2>
      <p>عند ربط حسابك بـ TikTok:</p>
      <ul>
        <li>تمنحنا إذناً للنشر نيابة عنك</li>
        <li>تتحمل مسؤولية المحتوى المنشور</li>
        <li>يجب الالتزام بسياسات TikTok</li>
        <li>يمكنك إلغاء الربط في أي وقت</li>
      </ul>
      
      <h2>4. المحتوى والملكية</h2>
      <p>أنت تحتفظ بملكية المحتوى الذي تنشئه. بنشر المحتوى عبر منصتنا، تمنحنا ترخيصاً لاستخدامه لأغراض تقديم الخدمة.</p>
      
      <h2>5. الاستخدام المقبول</h2>
      <p>يُحظر استخدام الخدمة في:</p>
      <ul>
        <li>نشر محتوى مخالف للأنظمة السعودية</li>
        <li>الإعلانات المضللة أو الكاذبة</li>
        <li>انتهاك حقوق الآخرين</li>
        <li>أي نشاط غير قانوني</li>
      </ul>
      
      <h2>6. إخلاء المسؤولية</h2>
      <p>تُقدم الخدمة "كما هي" دون ضمانات. لا نتحمل مسؤولية أي خسائر ناتجة عن استخدام الخدمة.</p>
      
      <h2>7. التعديلات</h2>
      <p>نحتفظ بحق تعديل هذه الشروط. سيتم إخطارك بأي تغييرات جوهرية.</p>
      
      <h2>8. التواصل</h2>
      <p>للاستفسارات: support@wasataai.com</p>

      <div class="english-section">
        <h1>Terms of Service</h1>
        <p><strong>Effective Date:</strong> January 1, 2025</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By using Wasata AI application and TikTok integration features, you agree to be bound by these terms and conditions.</p>
        
        <h2>2. Service Description</h2>
        <p>Wasata AI provides a real estate brokerage platform including:</p>
        <ul>
          <li>Real estate listing management</li>
          <li>Content publishing on social media platforms including TikTok</li>
          <li>AI-powered assistance tools</li>
          <li>Customer and appointment management</li>
        </ul>
        
        <h2>3. TikTok Integration Usage</h2>
        <p>When connecting your TikTok account:</p>
        <ul>
          <li>You grant us permission to publish on your behalf</li>
          <li>You are responsible for published content</li>
          <li>You must comply with TikTok policies</li>
          <li>You can disconnect at any time</li>
        </ul>
        
        <h2>4. Content and Ownership</h2>
        <p>You retain ownership of content you create. By publishing through our platform, you grant us a license to use it for service delivery purposes.</p>
        
        <h2>5. Acceptable Use</h2>
        <p>The service may not be used for:</p>
        <ul>
          <li>Publishing content violating Saudi regulations</li>
          <li>Misleading or false advertisements</li>
          <li>Violating others' rights</li>
          <li>Any illegal activity</li>
        </ul>
        
        <h2>6. Disclaimer</h2>
        <p>The service is provided "as is" without warranties. We are not liable for any losses resulting from service use.</p>
        
        <h2>7. Modifications</h2>
        <p>We reserve the right to modify these terms. You will be notified of any material changes.</p>
        
        <h2>8. Contact</h2>
        <p>For inquiries: support@wasataai.com</p>
      </div>
    </div>
    
    <div class="nav-links">
      <a href="/">الرئيسية</a>
      <a href="/privacy">سياسة الخصوصية</a>
    </div>
    
    <div class="footer">
      <p>© 2025 Wasata AI. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
`;

const privacyPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سياسة الخصوصية - Wasata AI</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">وساطة AI</div>
      <div class="subtitle">سياسة الخصوصية</div>
    </div>
    
    <div class="card">
      <h1>سياسة الخصوصية</h1>
      <p><strong>تاريخ السريان:</strong> 1 يناير 2025</p>
      
      <h2>1. مقدمة</h2>
      <p>نحن في وساطة AI نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.</p>
      
      <h2>2. البيانات التي نجمعها</h2>
      <ul>
        <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الجوال</li>
        <li><strong>بيانات TikTok:</strong> معرف الحساب، توكن الوصول (عند الربط)</li>
        <li><strong>المحتوى:</strong> الفيديوهات والنصوص التي تنشئها</li>
        <li><strong>بيانات الاستخدام:</strong> كيفية تفاعلك مع التطبيق</li>
      </ul>
      
      <h2>3. كيف نستخدم بياناتك</h2>
      <ul>
        <li>تقديم وتحسين خدماتنا</li>
        <li>نشر المحتوى على TikTok نيابة عنك</li>
        <li>التواصل معك بخصوص حسابك</li>
        <li>تحليل الأداء وتحسين التجربة</li>
      </ul>
      
      <h2>4. مشاركة البيانات</h2>
      <p>لا نبيع بياناتك. قد نشاركها مع:</p>
      <ul>
        <li>TikTok (للنشر عند طلبك)</li>
        <li>مزودي الخدمات الموثوقين</li>
        <li>السلطات عند الطلب القانوني</li>
      </ul>
      
      <h2>5. أمان البيانات</h2>
      <p>نستخدم تقنيات تشفير متقدمة وإجراءات أمان صارمة لحماية بياناتك.</p>
      
      <h2>6. حقوقك</h2>
      <ul>
        <li>الوصول لبياناتك</li>
        <li>تصحيح البيانات غير الدقيقة</li>
        <li>حذف حسابك وبياناتك</li>
        <li>إلغاء ربط TikTok في أي وقت</li>
      </ul>
      
      <h2>7. ملفات تعريف الارتباط</h2>
      <p>نستخدم الكوكيز لتحسين تجربتك. يمكنك التحكم بها من إعدادات المتصفح.</p>
      
      <h2>8. التحديثات</h2>
      <p>قد نحدث هذه السياسة. سنخطرك بالتغييرات الجوهرية.</p>
      
      <h2>9. التواصل</h2>
      <p>لأي استفسارات حول الخصوصية: privacy@wasataai.com</p>

      <div class="english-section">
        <h1>Privacy Policy</h1>
        <p><strong>Effective Date:</strong> January 1, 2025</p>
        
        <h2>1. Introduction</h2>
        <p>At Wasata AI, we are committed to protecting your privacy. This policy explains how we collect, use, and protect your information.</p>
        
        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Account Information:</strong> Name, email, phone number</li>
          <li><strong>TikTok Data:</strong> Account ID, access token (when connected)</li>
          <li><strong>Content:</strong> Videos and texts you create</li>
          <li><strong>Usage Data:</strong> How you interact with the app</li>
        </ul>
        
        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>Provide and improve our services</li>
          <li>Publish content on TikTok on your behalf</li>
          <li>Communicate with you about your account</li>
          <li>Analyze performance and improve experience</li>
        </ul>
        
        <h2>4. Data Sharing</h2>
        <p>We do not sell your data. We may share it with:</p>
        <ul>
          <li>TikTok (for publishing at your request)</li>
          <li>Trusted service providers</li>
          <li>Authorities when legally required</li>
        </ul>
        
        <h2>5. Data Security</h2>
        <p>We use advanced encryption technologies and strict security measures to protect your data.</p>
        
        <h2>6. Your Rights</h2>
        <ul>
          <li>Access your data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your account and data</li>
          <li>Disconnect TikTok at any time</li>
        </ul>
        
        <h2>7. Cookies</h2>
        <p>We use cookies to improve your experience. You can control them through browser settings.</p>
        
        <h2>8. Updates</h2>
        <p>We may update this policy. We will notify you of material changes.</p>
        
        <h2>9. Contact</h2>
        <p>For privacy inquiries: privacy@wasataai.com</p>
      </div>
    </div>
    
    <div class="nav-links">
      <a href="/">الرئيسية</a>
      <a href="/terms">شروط الاستخدام</a>
    </div>
    
    <div class="footer">
      <p>© 2025 Wasata AI. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    let html: string;
    
    if (path === '/terms' || path === '/terms/') {
      html = termsPage;
    } else if (path === '/privacy' || path === '/privacy/') {
      html = privacyPage;
    } else {
      html = homePage;
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
