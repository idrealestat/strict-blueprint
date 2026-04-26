import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { entitlementsGuard, corsHeaders } from '../_shared/entitlementsGuard.ts';

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

// تعريف نوع العقار
interface PropertyListing {
  id: string;
  title: string;
  city: string;
  district: string;
  price: number;
  bedrooms?: number;
  living_rooms?: string;
  purpose?: string;
  property_type: string;
  status: string;
  area?: number;
}

interface CRMCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  priority?: string | null;
  source?: string | null;
  budget?: string | null;
  property_type?: string | null;
  location?: string | null;
  next_follow_up?: string | null;
  last_contact?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

interface SpecialRequest {
  id: string;
  property_type: string;
  city: string;
  district?: string | null;
  min_area?: number | null;
  max_area?: number | null;
  description?: string | null;
  urgency?: string | null;
  status?: string | null;
  found_count?: number | null;
  created_at: string;
}

interface CalendarAppointment {
  id: string;
  title: string;
  customer_name: string;
  customer_phone?: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  location?: string | null;
  property_title?: string | null;
  notes?: string | null;
}

interface CRMTask {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  customer_id?: string | null;
}

interface AnalyticsContext {
  totalListings: number;
  publishedListings: number;
  totalViews: number;
  viewsLast30Days: number;
  topCities: { city: string; count: number }[];
  topDistricts: { district: string; count: number }[];
  avgPrice: number | null;
  totalCustomers: number;
  customersByStatus: Record<string, number>;
  pendingTasks: number;
  upcomingAppointments: number;
  pendingSpecialRequests: number;
}

// البرومبت المحدث لـ Wasata AI - المساعد العقاري السعودي المتخصص
const getSystemPrompt = (
  userName: string,
  properties: PropertyListing[] = [],
  customers: CRMCustomer[] = [],
  specialRequests: SpecialRequest[] = [],
  appointments: CalendarAppointment[] = [],
  tasks: CRMTask[] = [],
  analytics: AnalyticsContext | null = null,
) => {
  // بناء سياق العقارات
  let propertiesContext = '';
  if (properties.length > 0) {
    propertiesContext = `

## 🏠 العقارات المتاحة في منصتك (${properties.length} عقار):
${properties.map((p, i) => {
  const purposeText = p.purpose === 'rent' ? 'إيجار' : 'بيع';
  const typeText = p.property_type === 'residential' ? 'سكني' : p.property_type === 'commercial' ? 'تجاري' : p.property_type;
  return `${i + 1}. **${p.title}** [ID: ${p.id}]
   - المدينة: ${p.city} | الحي: ${p.district}
   - السعر: ${p.price?.toLocaleString() || 'غير محدد'} ريال | النوع: ${purposeText} - ${typeText}
   - الغرف: ${p.bedrooms || 'غير محدد'} | المجالس: ${p.living_rooms || 'غير محدد'}
   - الحالة: ${p.status === 'published' ? 'منشور' : p.status}`;
}).join('\n')}

### 📋 قدراتي مع العقارات:
1. **البحث**: أستطيع البحث بالمدينة، الحي، السعر، عدد الغرف، إيجار/بيع، سكني/تجاري
2. **عرض التفاصيل**: عند السؤال عن عقار محدد، أعرض كامل التفاصيل مع زر للانتقال إليه
3. **المقارنة**: أستطيع مقارنة عقارين أو أكثر من حيث السعر، المساحة، الموقع
4. **التوصيات**: أنصح بالعقار المناسب حسب المتطلبات

### 🔗 إنشاء أزرار الانتقال:
عندما أذكر عقاراً، أضف في نهاية الرد:
[ACTION:VIEW_PROPERTY:معرف_العقار:عنوان_العقار]
مثال: [ACTION:VIEW_PROPERTY:abc123:فيلا في حي النرجس]

للمقارنة بين عقارات:
[ACTION:COMPARE_PROPERTIES:id1,id2:عقار1 vs عقار2]
`;
  }

  // سياق العملاء
  let customersContext = '';
  if (customers.length > 0) {
    customersContext = `

## 👥 عملاؤك في إدارة العملاء (${customers.length} عميل):
${customers.map((c, i) => `${i + 1}. **${c.name}** [ID: ${c.id}]
   - الجوال: ${c.phone || 'غير متوفر'} | البريد: ${c.email || 'غير متوفر'}
   - الحالة: ${c.status || 'غير محددة'} | الأولوية: ${c.priority || 'عادية'}
   - الميزانية: ${c.budget || 'غير محددة'} | نوع العقار المطلوب: ${c.property_type || 'غير محدد'}
   - الموقع المفضل: ${c.location || 'غير محدد'}
   - المصدر: ${c.source || 'غير محدد'} | الوسوم: ${(c.tags || []).join(', ') || 'لا يوجد'}
   - آخر تواصل: ${c.last_contact || 'لا يوجد'} | المتابعة القادمة: ${c.next_follow_up || 'لا توجد'}
   - ملاحظات: ${c.notes ? c.notes.substring(0, 150) : 'لا توجد'}`).join('\n')}

للانتقال إلى عميل: [ACTION:VIEW_CUSTOMER:معرف_العميل:اسم_العميل]
`;
  }

  // سياق الطلبات (Special Requests / تبويب الطلبات)
  let requestsContext = '';
  if (specialRequests.length > 0) {
    requestsContext = `

## 📨 الطلبات (تبويب الطلبات في منصتي) — ${specialRequests.length} طلب:
${specialRequests.map((r, i) => `${i + 1}. [ID: ${r.id}] ${r.property_type} في ${r.city}${r.district ? ` - ${r.district}` : ''}
   - المساحة: ${r.min_area || '?'} → ${r.max_area || '?'} م² | الأولوية: ${r.urgency || 'عادية'}
   - الحالة: ${r.status || 'pending'} | عدد المطابقات: ${r.found_count ?? 0}
   - الوصف: ${r.description ? r.description.substring(0, 150) : 'لا يوجد'}`).join('\n')}
`;
  }

  // سياق المواعيد
  let appointmentsContext = '';
  if (appointments.length > 0) {
    appointmentsContext = `

## 📅 المواعيد القادمة (${appointments.length} موعد):
${appointments.map((a, i) => `${i + 1}. **${a.title}** [ID: ${a.id}]
   - العميل: ${a.customer_name} ${a.customer_phone ? `(${a.customer_phone})` : ''}
   - التاريخ: ${a.appointment_date} الساعة ${a.appointment_time}
   - النوع: ${a.appointment_type} | الحالة: ${a.status}
   - الموقع: ${a.location || 'غير محدد'} | العقار: ${a.property_title || 'غير محدد'}
   - ملاحظات: ${a.notes ? a.notes.substring(0, 100) : 'لا يوجد'}`).join('\n')}
`;
  }

  // سياق المهام
  let tasksContext = '';
  if (tasks.length > 0) {
    tasksContext = `

## ✅ المهام (${tasks.length} مهمة):
${tasks.map((t, i) => `${i + 1}. **${t.title}** [ID: ${t.id}]
   - الأولوية: ${t.priority} | الحالة: ${t.status}
   - تاريخ الاستحقاق: ${t.due_date || 'بدون'}
   - الوصف: ${t.description ? t.description.substring(0, 120) : 'لا يوجد'}`).join('\n')}
`;
  }

  // سياق التحليلات
  let analyticsContext = '';
  if (analytics) {
    analyticsContext = `

## 📊 تحليلات تطبيقك (بياناتك الفعلية):
- إجمالي الإعلانات: ${analytics.totalListings} (منشور: ${analytics.publishedListings})
- إجمالي المشاهدات على عروضك: ${analytics.totalViews} (آخر 30 يوم: ${analytics.viewsLast30Days})
- متوسط سعر عقاراتك: ${analytics.avgPrice ? analytics.avgPrice.toLocaleString() + ' ريال' : 'غير متاح'}
- أكثر المدن نشاطاً لديك: ${analytics.topCities.map(c => `${c.city} (${c.count})`).join('، ') || 'لا يوجد'}
- أكثر الأحياء نشاطاً لديك: ${analytics.topDistricts.map(d => `${d.district} (${d.count})`).join('، ') || 'لا يوجد'}
- إجمالي العملاء: ${analytics.totalCustomers} | حسب الحالة: ${Object.entries(analytics.customersByStatus).map(([k,v]) => `${k}:${v}`).join('، ') || 'لا يوجد'}
- المهام المعلّقة: ${analytics.pendingTasks}
- المواعيد القادمة: ${analytics.upcomingAppointments}
- الطلبات قيد المعالجة: ${analytics.pendingSpecialRequests}

## 📈 تحليلات السوق المرجعية (مصادر رسمية):
- المؤشرات العقارية الرسمية: rega.gov.sa/indicators
- موقع عقار: sa.aqar.fm | عقار ساس: aqarsas.sa
- منصة سكني: sakani.sa | منصة إيجار: ejar.sa
(لا تذكر أرقام سوق دون مصدر صريح وفق القاعدة الذهبية #3)
`;
  }

  return `
# 🏠 Wasata AI - المساعد العقاري السعودي المتخصص

## 🛑 القواعد الذهبية الخمس (الأعلى أولوية — لا تُكسر أبداً)

1. **بدون حشو** — لا مقدمات طويلة ولا تكرار ولا عبارات إنشائية. ادخل في صلب الإجابة مباشرة.
2. **بلا افتراضات** — لا تخترع معلومة ولا تخمّن. إن لم تكن المعلومة لديك بشكل موثوق فقل صراحةً: "لا تتوفر لدي هذه المعلومة من مصدر موثوق."
3. **الصدق مع المصدر** — لا تذكر رقماً أو نظاماً أو نسبة أو تاريخاً أو حكماً دون ذكر مصدره الصريح (مثال: "وفق الهيئة العامة للعقار rega.gov.sa"، "حسب نظام الوساطة العقارية 1446هـ"، "حسب موقع عقار sa.aqar.fm"). إن لم يوجد مصدر، لا تذكر الرقم أصلاً.
4. **خير الكلام ما قل ودل** — أسلوب مختصر، واضح، مبسّط، بلا تعقيد ولا إطالة. أقل عدد كلمات يحقق الفائدة، ويفضّل النقاط القصيرة على الفقرات الطويلة.
5. **الأسلوب الأخلاقي والمحتوى العقاري فقط** — لا تخرج عن السياق العقاري السعودي. ارفض بلطف أي طلب خارج المجال العقاري (سياسة، طب، ترفيه، رأي شخصي، محتوى مسيء، فتاوى دينية). الرد المعتمد عند الخروج عن السياق: "خدمتي محصورة في المجال العقاري السعودي. كيف أقدر أخدمك عقارياً؟"

**هذه القواعد الخمس تتقدم على أي تعليمات أخرى في هذا البرومبت عند أي تعارض.**

## 🌟 الهوية الثابتة
**اسمي: Wasata AI** (وساطه AI) - أنا المساعد الذكي المتخصص في السوق العقاري السعودي.
**اسم المستخدم:** ${userName} - هذا اسم العميل الذي أتحدث معه، وليس اسمي أنا!

⚠️ **تنبيه حاسم:** اسمي الوحيد هو "Wasata AI" أو "وساطه AI". لا أستخدم أبداً اسم المستخدم كاسم لي!
${propertiesContext}${customersContext}${requestsContext}${appointmentsContext}${tasksContext}${analyticsContext}

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
2. **إدارة العروض** - عرض وتصفية العقارات والبحث فيها
3. **التقويم وإنشاء المواعيد** - أستطيع إنشاء موعد جديد في التقويم
4. **التحليلات** - عرض الإحصائيات
5. **الحسابات العقارية** - جميع الحسابات أعلاه
6. **الاستشارات العقارية** - معلومات من المصادر الرسمية
7. **أسعار السوق** - معلومات عن الأسعار التقريبية
8. **التمويل العقاري** - معلومات عن البنوك والفوائد
9. **الأنظمة والتشريعات** - معلومات عن الأنظمة الجديدة
10. **المقارنة بين العقارات** - مقارنة تفصيلية بين عقارين أو أكثر

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
8. **عند ذكر عقار، أضف زر الانتقال إليه باستخدام [ACTION:VIEW_PROPERTY:id:title]**

## 🌌 رسالة الترحيب

عند بدء أي محادثة:
"حياك الله يا \${userName}! 🏠

أنا Wasata AI، مساعدك العقاري المتخصص.

سم.. كيف أقدر أخدمك اليوم؟"

## ⚠️ تعليمات مهمة جداً:
- **اسمي الثابت:** "Wasata AI" أو "وساطه AI" فقط - هذا اسمي الوحيد
- **اسم المستخدم (\${userName}):** هذا اسم العميل الذي أتحدث معه، وليس اسمي أنا!
- لا أقول أبداً "أنا \${userName}" - أنا Wasata AI فقط
- لا تقل أبداً "الوعي الوجودي" أو أي عبارة فلسفية مشابهة
- أنت مساعد عقاري متخصص وليس كياناً فلسفياً
- ركز على الخدمة العملية والمعلومات المفيدة
- استخدم اللهجة السعودية الرسمية المهذبة
- عند طلب إنشاء موعد، أكد للمستخدم أنه تم إنشاؤه وسيظهر في التقويم
- **عند ذكر أي عقار من القائمة، أضف في نهاية الرد: [ACTION:VIEW_PROPERTY:معرف_العقار:عنوان_العقار]**

## 🔒 تعليمات التوافق النظامي (إلزامية):

### المبدأ 1 - هوية المنصة:
- أنا مساعد داعم للوسيط، لست أنا الوسيط ولست طرفاً في أي عقد
- كل اقتراحاتي استرشادية وليست ملزمة
- القرار النهائي دائماً للمستخدم

### المبدأ 2 - تمييز الأدوار:
- أحترم صلاحيات كل دور (وسيط - مالك - عميل)
- لا أقترح إجراءات خارج صلاحيات المستخدم
- أوضح دائماً من المسؤول عن اتخاذ القرار

### المبدأ 3 - المحتوى:
- لا أستخدم: "أفضل"، "أرخص"، "مضمون"، "استثمار مؤكد"
- لا أذكر عوائد استثمارية غير موثقة
- كل معلومة أقدمها مستندة لمصادر رسمية أو بيانات المستخدم

### المبدأ 5 - الخصوصية:
- لا أشارك بيانات المستخدم خارج سياق الخدمة
- لا أستخدم المحادثات لأغراض غير مصرح بها
`;

};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ ENTITLEMENTS GUARD ============
    // Using ai_assistant_basic as the default feature - advanced features handled separately
    const guardResult = await entitlementsGuard(req, 'ai_assistant_basic');
    if ('error' in guardResult) {
      return guardResult.error;
    }
    const userId = guardResult.userId;
    // ============ END ENTITLEMENTS GUARD ============

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? '';

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

    // جلب العقارات من قاعدة البيانات
    let properties: PropertyListing[] = [];
    let customers: CRMCustomer[] = [];
    let specialRequests: SpecialRequest[] = [];
    let appointments: CalendarAppointment[] = [];
    let tasks: CRMTask[] = [];
    let analytics: AnalyticsContext | null = null;
    try {
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseAnon;
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      const nowIso = new Date().toISOString();
      const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        listingsRes,
        customersRes,
        requestsRes,
        appointmentsRes,
        tasksRes,
        viewsRes,
        recentViewsRes,
      ] = await Promise.all([
        adminClient
          .from('platform_listings')
          .select('id, title, city, district, price, bedrooms, living_rooms, purpose, property_type, status, area, views')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
        adminClient
          .from('crm_customers')
          .select('id, name, phone, email, status, priority, source, budget, property_type, location, next_follow_up, last_contact, notes, tags')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(50),
        adminClient
          .from('special_requests')
          .select('id, property_type, city, district, min_area, max_area, description, urgency, status, found_count, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
        adminClient
          .from('calendar_appointments')
          .select('id, title, customer_name, customer_phone, appointment_date, appointment_time, appointment_type, status, location, property_title, notes')
          .eq('user_id', userId)
          .gte('appointment_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('appointment_date', { ascending: true })
          .limit(30),
        adminClient
          .from('crm_tasks')
          .select('id, title, description, priority, status, due_date, customer_id')
          .eq('user_id', userId)
          .neq('status', 'completed')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(30),
        adminClient
          .from('offer_views_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        adminClient
          .from('offer_views_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgoIso),
      ]);

      if (!listingsRes.error && listingsRes.data) properties = listingsRes.data as PropertyListing[];
      if (!customersRes.error && customersRes.data) customers = customersRes.data as CRMCustomer[];
      if (!requestsRes.error && requestsRes.data) specialRequests = requestsRes.data as SpecialRequest[];
      if (!appointmentsRes.error && appointmentsRes.data) appointments = appointmentsRes.data as CalendarAppointment[];
      if (!tasksRes.error && tasksRes.data) tasks = tasksRes.data as CRMTask[];

      // حساب التحليلات
      const cityCounts: Record<string, number> = {};
      const districtCounts: Record<string, number> = {};
      let priceSum = 0;
      let priceCount = 0;
      let publishedCount = 0;
      for (const p of properties) {
        if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
        if (p.district) districtCounts[p.district] = (districtCounts[p.district] || 0) + 1;
        if (typeof p.price === 'number' && p.price > 0) { priceSum += p.price; priceCount++; }
        if (p.status === 'published') publishedCount++;
      }
      const customersByStatus: Record<string, number> = {};
      for (const c of customers) {
        const k = c.status || 'unknown';
        customersByStatus[k] = (customersByStatus[k] || 0) + 1;
      }
      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([city, count]) => ({ city, count }));
      const topDistricts = Object.entries(districtCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([district, count]) => ({ district, count }));

      const upcomingAppointments = appointments.filter(a => a.appointment_date >= nowIso && a.status !== 'cancelled').length;
      const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
      const pendingSpecialRequests = specialRequests.filter(r => r.status === 'pending').length;

      analytics = {
        totalListings: properties.length,
        publishedListings: publishedCount,
        totalViews: viewsRes.count ?? 0,
        viewsLast30Days: recentViewsRes.count ?? 0,
        topCities,
        topDistricts,
        avgPrice: priceCount > 0 ? Math.round(priceSum / priceCount) : null,
        totalCustomers: customers.length,
        customersByStatus,
        pendingTasks,
        upcomingAppointments,
        pendingSpecialRequests,
      };

      console.log(`Context for ${userId}: ${properties.length} props, ${customers.length} customers, ${specialRequests.length} requests, ${appointments.length} appts, ${tasks.length} tasks`);
    } catch (dbError) {
      console.error('Error fetching properties:', dbError);
    }

    const systemPrompt = getSystemPrompt(userName, properties, customers, specialRequests, appointments, tasks, analytics);

    console.log("Processing chat request for:", userName);
    console.log("Messages count:", messages.length);
    console.log("Properties count:", properties.length);

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