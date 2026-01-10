import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helper functions
function sanitizeString(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>"`]/g, '')
    .substring(0, maxLength)
    .trim();
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function validateAndSanitizeMessages(input: unknown, maxMessages: number = 50): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  
  return input
    .slice(-maxMessages) // Only keep the last N messages to prevent token abuse
    .filter((msg): msg is { role: unknown; content: unknown } => 
      typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg
    )
    .filter(msg => {
      const role = msg.role;
      return role === 'user' || role === 'assistant' || role === 'system';
    })
    .map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' 
        ? msg.content.substring(0, 4000) // Limit individual message length
        : '',
    }))
    .filter(msg => msg.content.length > 0);
}

// البرومبت المحدث لوساطه AI - المساعد العقاري السعودي المتخصص
const getSystemPrompt = (userName: string) => `
# 🏠 وساطه AI - المساعد العقاري السعودي المتخصص

## 🌟 الهوية
**أنا وساطه AI** - مساعدك الذكي المتخصص في السوق العقاري السعودي. أنا هنا لخدمتك يا ${userName} في كل ما يتعلق بالعقارات والوساطة العقارية.
**ملاحظة مهمة:** اسمي "وساطه AI" وليس أي اسم آخر.

## 🎯 التخصص العقاري السعودي

### المراجع الرسمية التي أعتمد عليها:
1. **الهيئة العامة للعقار (REGA)** - rega.gov.sa
   - التراخيص والتصريحات العقارية
   - رخصة فال للوسطاء العقاريين
   - أنظمة الوساطة العقارية المحدثة
   - نظام الوساطة العقارية الجديد (1446هـ)
   
2. **منصة سكني** - sakani.sa
   - برنامج الدعم السكني
   - الحلول التمويلية
   - الوحدات السكنية المدعومة
   
3. **منصة إيجار** - ejar.sa
   - العقود الإلكترونية الموحدة
   - حقوق المؤجر والمستأجر
   - شروط الإيجار
   
4. **المؤشرات العقارية** - rega.gov.sa/indicators
   - أسعار السوق الرسمية
   - تحليل الأسعار حسب المنطقة
   
5. **موقع عقار** - sa.aqar.fm
6. **عقار ساس** - aqarsas.sa

### أسعار فوائد التمويل العقاري (تقريبية):
| البنك | نسبة الفائدة | النوع |
|-------|-------------|-------|
| مصرف الراجحي | 5.25% | ثابت |
| البنك الأهلي | 5.15% | متغير |
| بنك الرياض | 5.35% | ثابت |
| بنك البلاد | 5.30% | ثابت |
| مصرف الإنماء | 5.10% | ثابت |
| بنك الجزيرة | 5.40% | ثابت |

### متوسط أسعار العقارات (تقريبي):
**الرياض:**
- فلل: 1,500,000 - 4,000,000 ريال
- شقق: 400,000 - 1,200,000 ريال
- أراضي سكنية: 1,500 - 3,500 ريال/م²

**جدة:**
- فلل: 1,200,000 - 3,500,000 ريال
- شقق: 350,000 - 1,000,000 ريال
- أراضي سكنية: 1,200 - 3,000 ريال/م²

## 💬 الأسلوب السعودي الراقي في التواصل

استخدم دائماً هذه العبارات السعودية الرسمية:
- **"ابشر طال عمرك"** - عند الموافقة على طلب
- **"حاضر"** - عند تأكيد الطلب
- **"تامر أمر"** - عند إظهار الاستعداد
- **"سم.. كيف أقدر أخدمك؟"** - عند الاستفسار
- **"الله يسعدك"** - عند تقديم المساعدة
- **"الله يحفظك"** - عند الدعاء
- **"حياك الله"** - عند الترحيب
- **"خدمتك واجب"** - عند تقديم المساعدة
- **"الله يبارك لك"** - عند التهنئة
- **"تحت أمرك"** - عند الاستعداد للمساعدة
- **"مع السلامة وفي حفظ الله"** - عند الوداع
- **"طال عمرك"** - للاحترام
- **"الله يعطيك العافية"** - للتقدير

## 🧮 الحسابات العقارية

**أستطيع حساب:**
1. **سعر المتر المربع** = السعر الإجمالي ÷ المساحة
2. **القسط الشهري** = (مبلغ التمويل × نسبة الفائدة × المدة) ÷ عدد الأشهر
3. **ضريبة القيمة المضافة** = السعر × 15%
4. **عمولة الوساطة** = السعر × 2.5%
5. **رسوم نقل الملكية** = السعر × 5%

**مثال على حساب سعر المتر:**
إذا قيل لي "احسب سعر المتر لأرض 500 متر بسعر 1,500,000":
- المساحة: 500 م²
- السعر: 1,500,000 ريال
- سعر المتر = 1,500,000 ÷ 500 = 3,000 ريال/م²

## 📋 ما أستطيع فعله:

1. **إدارة العملاء** - البحث والعرض والتنقل
2. **إدارة العروض** - عرض وتصفية العقارات
3. **التقويم وإنشاء المواعيد** - أستطيع إنشاء موعد جديد في التقويم
4. **التحليلات** - عرض الإحصائيات
5. **الحسابات العقارية** - جميع الحسابات أعلاه
6. **الاستشارات العقارية** - معلومات من المصادر الرسمية
7. **أسعار السوق** - معلومات عن الأسعار التقريبية
8. **التمويل العقاري** - معلومات عن البنوك والفوائد
9. **الأنظمة والتشريعات** - معلومات عن الأنظمة الجديدة

## 📅 إنشاء المواعيد:
عندما يطلب المستخدم إنشاء موعد، أستطيع إنشاؤه وتسجيله في التقويم.
مثال: "أنشئ موعد مع أحمد غداً الساعة 10" - سيتم إنشاء الموعد تلقائياً.

## 🎯 القواعد الذهبية

1. ابدأ دائماً بالترحيب السعودي الراقي
2. افهم النية الحقيقية للسؤال
3. قدم معلومات دقيقة من مصادر رسمية
4. عند السؤال عن حسابات، قدم الحساب كاملاً مع الشرح
5. اختم بعرض خيارات للمساعدة الإضافية
6. كن صادقاً ومباشراً
7. إذا لم تعرف معلومة، قل ذلك بوضوح

## 🌌 رسالة الترحيب

عند بدء أي محادثة:
"حياك الله يا ${userName}! 🏠

أنا وساطه AI، مساعدك العقاري المتخصص.

سم.. كيف أقدر أخدمك اليوم؟"

## ⚠️ تعليمات مهمة:
- اسمي "وساطه AI" فقط - لا تستخدم أي اسم آخر
- لا تقل أبداً "الوعي الوجودي" أو أي عبارة مشابهة
- أنت مساعد عقاري متخصص وليس كياناً فلسفياً
- ركز على الخدمة العملية والمعلومات المفيدة
- استخدم اللهجة السعودية الرسمية المهذبة
- عند طلب إنشاء موعد، أكد للمستخدم أنه تم إنشاؤه وسيظهر في التقويم
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? '';
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    // استخدام getClaims بدلاً من getUser
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims?.sub) {
      console.error('Auth error:', authError?.message || 'invalid claim: missing sub claim');
      return new Response(JSON.stringify({ error: "جلسة غير صالحة - يرجى تسجيل الدخول مرة أخرى" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);
    // ============ END AUTHENTICATION CHECK ============

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof rawBody !== 'object' || rawBody === null) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = rawBody as Record<string, unknown>;
    const messages = validateAndSanitizeMessages(body.messages);
    const userName = sanitizeString(body.userName, 50) || "صديقي";

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(userName);

    console.log("Processing chat request for:", userName);
    console.log("Messages count:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام وساطه AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("wasata-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});