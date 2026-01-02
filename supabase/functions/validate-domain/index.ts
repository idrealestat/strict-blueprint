import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== مستويات الأولوية ==========
// Priority 1: مالك نطاق رسمي مُحقق (أعلى أولوية)
// Priority 2: شركة / مكتب عقاري موثق
// Priority 3: أفراد (أقل أولوية)
const PRIORITY_LEVELS = {
  OFFICIAL_DOMAIN_OWNER: 1,
  COMPANY_OR_OFFICE: 2,
  INDIVIDUAL: 3
};

// خوارزمية حساب تشابه النصوص (Levenshtein Distance)
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// حساب نسبة التشابه
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

// استخراج جذر النطاق
function extractDomainRoot(domain: string): string {
  if (!domain) return '';
  let cleaned = domain.toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .split('.')[0];
  return cleaned;
}

// تنظيف الاسم للمقارنة (يزيل الشرطات للمقارنة)
function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '')
    .trim();
}

// تنظيف الاسم مع الحفاظ على الشرطات (للتخزين)
function cleanNameKeepDashes(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

// توليد اقتراحات بديلة للنطاق
function generateAlternativeSuggestions(baseName: string): string[] {
  const suggestions: string[] = [];
  const cleanBase = cleanNameKeepDashes(baseName);
  
  // إضافة أرقام
  suggestions.push(`${cleanBase}-1`);
  suggestions.push(`${cleanBase}-ksa`);
  suggestions.push(`${cleanBase}-sa`);
  suggestions.push(`${cleanBase}-pro`);
  suggestions.push(`${cleanBase}-realestate`);
  
  // إذا كان يحتوي على شرطة، جرب بدونها
  if (cleanBase.includes('-')) {
    suggestions.push(cleanBase.replace(/-/g, ''));
  }
  
  return suggestions.slice(0, 5);
}

// تحديد مستوى الأولوية
function determinePriorityLevel(
  accountType: string,
  hasOfficialDomain: boolean,
  websiteUrl: string | null
): number {
  // أولوية 1: لديه نطاق رسمي مطابق
  if (hasOfficialDomain && websiteUrl) {
    return PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER;
  }
  
  // أولوية 2: شركة أو مكتب
  if (accountType === 'company' || accountType === 'office') {
    return PRIORITY_LEVELS.COMPANY_OR_OFFICE;
  }
  
  // أولوية 3: فرد
  return PRIORITY_LEVELS.INDIVIDUAL;
}

// الأسماء العربية الشائعة
const COMMON_FIRST_NAMES = [
  'محمد', 'أحمد', 'علي', 'عبدالله', 'خالد', 'سعود', 'فهد', 'ناصر', 'سلطان', 'عبدالرحمن',
  'عمر', 'سالم', 'يوسف', 'إبراهيم', 'حسن', 'حسين', 'عبدالعزيز', 'سعد', 'تركي', 'بندر',
  'mohammed', 'ahmad', 'ali', 'abdullah', 'khaled', 'saud', 'fahad', 'nasser', 'sultan'
];

interface ValidationResult {
  allowed: boolean;
  status: 'available' | 'unavailable' | 'pending' | 'error';
  reason?: string;
  matched_company?: string;
  requires_approval?: boolean;
  priority_level?: number;
  alternative_suggestions?: string[];
  official_domain_verified?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userTitle, companyName, websiteUrl, accountType } = await req.json();

    if (!userTitle) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          status: 'error',
          reason: 'يجب إدخال اسم المستخدم' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cleanedTitle = cleanName(userTitle);
    const cleanedTitleWithDashes = cleanNameKeepDashes(userTitle);
    console.log('Validating domain:', userTitle, 'Cleaned:', cleanedTitle);

    // تحديد مستوى الأولوية
    let hasOfficialDomain = false;
    let officialDomainVerified = false;
    
    // التحقق من تطابق النطاق الرسمي
    if (websiteUrl) {
      const websiteDomainRoot = extractDomainRoot(websiteUrl);
      if (websiteDomainRoot && cleanedTitle.includes(websiteDomainRoot)) {
        hasOfficialDomain = true;
        officialDomainVerified = true;
        console.log('Official domain match detected:', websiteDomainRoot);
      }
    }

    const priorityLevel = determinePriorityLevel(accountType, hasOfficialDomain, websiteUrl);
    console.log('Priority level determined:', priorityLevel);

    // 1. التحقق من الأسماء الشائعة (أفراد فقط)
    if (accountType === 'individual' || !accountType) {
      const isCommonFirstName = COMMON_FIRST_NAMES.some(name => 
        cleanName(name) === cleanedTitle
      );

      if (isCommonFirstName && !/\d/.test(userTitle) && !userTitle.includes('-')) {
        return new Response(
          JSON.stringify({
            allowed: false,
            status: 'pending',
            reason: 'الأسماء الشائعة تحتاج إلى رقم إضافي أو شرطة (مثال: ahmed-123) أو موافقة الإدارة',
            requires_approval: true,
            priority_level: priorityLevel,
            alternative_suggestions: generateAlternativeSuggestions(userTitle)
          } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. جلب الأنماط المحظورة
    const { data: patterns } = await supabase
      .from('forbidden_patterns')
      .select('pattern')
      .eq('is_active', true);

    if (patterns) {
      for (const { pattern } of patterns) {
        if (cleanedTitle.includes(cleanName(pattern))) {
          // إذا كان حساب شركة ولديه موقع يطابق النطاق
          if (accountType === 'company' && websiteUrl) {
            const websiteDomainRoot = extractDomainRoot(websiteUrl);
            if (websiteDomainRoot && cleanedTitle.includes(websiteDomainRoot)) {
              console.log('Company owns domain, allowing:', cleanedTitle);
              continue;
            }
          }
          
          return new Response(
            JSON.stringify({
              allowed: false,
              status: 'unavailable',
              reason: `الاسم يحتوي على كلمة محجوزة: ${pattern}`,
              alternative_suggestions: generateAlternativeSuggestions(userTitle)
            } as ValidationResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 3. جلب القائمة السوداء
    const { data: blacklist } = await supabase
      .from('domain_blacklist')
      .select('*')
      .eq('is_active', true);

    if (blacklist) {
      for (const entry of blacklist) {
        // التحقق من تطابق النطاق
        const entryDomainClean = entry.domain_root ? cleanName(entry.domain_root) : null;
        
        if (entryDomainClean && cleanedTitle === entryDomainClean) {
          // إذا كان حساب شركة ولديه نفس الموقع - قبول تلقائي (Priority 1)
          if (accountType === 'company' && websiteUrl) {
            const websiteDomainRoot = extractDomainRoot(websiteUrl);
            if (websiteDomainRoot === entryDomainClean) {
              // التحقق من أن النطاق غير مستخدم من شخص آخر
              const { data: existingCards } = await supabase
                .from('business_cards')
                .select('slug, user_id')
                .eq('slug', cleanedTitleWithDashes);

              if (existingCards && existingCards.length > 0) {
                // النطاق مستخدم - يحتاج طلب لاسترداده
                console.log('Domain used by another user, requiring claim:', cleanedTitle);
                return new Response(
                  JSON.stringify({
                    allowed: false,
                    status: 'pending',
                    reason: 'النطاق مستخدم حالياً. بصفتك مالك النطاق الأصلي، يمكنك إرسال طلب استرداد.',
                    matched_company: entry.company_name,
                    requires_approval: true,
                    priority_level: PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER,
                    official_domain_verified: true
                  } as ValidationResult),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }

              console.log('Official domain owner verified, auto-approving:', cleanedTitle);
              return new Response(
                JSON.stringify({
                  allowed: true,
                  status: 'available',
                  reason: 'تم التحقق من ملكية النطاق الرسمي - قبول تلقائي ✅',
                  priority_level: PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER,
                  official_domain_verified: true
                } as ValidationResult),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          return new Response(
            JSON.stringify({
              allowed: false,
              status: 'unavailable',
              reason: 'النطاق مملوك لشركة مسجلة. إذا كنت المالك الأصلي، يرجى إدخال رابط موقعك الإلكتروني للتحقق.',
              matched_company: entry.company_name,
              alternative_suggestions: generateAlternativeSuggestions(userTitle)
            } as ValidationResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // التحقق من تشابه اسم الشركة (fuzzy matching)
        const companyNameClean = cleanName(entry.company_name);
        const similarity = similarityRatio(cleanedTitle, companyNameClean);
        
        if (similarity > 0.7) {
          // تشابه عالي - يحتاج موافقة
          if (accountType === 'company' && companyName) {
            const userCompanyClean = cleanName(companyName);
            if (similarityRatio(userCompanyClean, companyNameClean) > 0.8) {
              console.log('Company name matches, allowing:', cleanedTitle);
              continue;
            }
          }

          return new Response(
            JSON.stringify({
              allowed: false,
              status: 'pending',
              reason: `الاسم يشبه شركة مسجلة: ${entry.company_name}`,
              matched_company: entry.company_name,
              requires_approval: true,
              priority_level: priorityLevel,
              alternative_suggestions: generateAlternativeSuggestions(userTitle)
            } as ValidationResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // التحقق من الاسم الإنجليزي
        if (entry.company_name_en) {
          const englishNameClean = cleanName(entry.company_name_en);
          const engSimilarity = similarityRatio(cleanedTitle, englishNameClean);
          
          if (engSimilarity > 0.7) {
            return new Response(
              JSON.stringify({
                allowed: false,
                status: 'pending',
                reason: `الاسم يشبه شركة مسجلة: ${entry.company_name_en}`,
                matched_company: entry.company_name,
                requires_approval: true,
                priority_level: priorityLevel,
                alternative_suggestions: generateAlternativeSuggestions(userTitle)
              } as ValidationResult),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // 4. التحقق من النطاقات المسجلة مسبقاً في business_cards
    const { data: existingCards } = await supabase
      .from('business_cards')
      .select('slug, user_id')
      .eq('slug', cleanedTitleWithDashes);

    if (existingCards && existingCards.length > 0) {
      // إذا كان مالك نطاق رسمي، يمكنه المطالبة بالأولوية
      if (officialDomainVerified && priorityLevel === PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER) {
        return new Response(
          JSON.stringify({
            allowed: false,
            status: 'pending',
            reason: 'النطاق مستخدم حالياً. بصفتك مالك النطاق الأصلي، يمكنك إرسال طلب استرداد بأولوية عالية.',
            requires_approval: true,
            priority_level: PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER,
            official_domain_verified: true
          } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          allowed: false,
          status: 'unavailable',
          reason: 'هذا النطاق مستخدم بالفعل',
          alternative_suggestions: generateAlternativeSuggestions(userTitle)
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. التحقق من طلبات معلقة
    const { data: pendingRequests } = await supabase
      .from('domain_requests')
      .select('*')
      .eq('requested_title', cleanedTitleWithDashes)
      .eq('status', 'pending');

    if (pendingRequests && pendingRequests.length > 0) {
      // إذا كان مالك نطاق رسمي، له أولوية أعلى
      if (officialDomainVerified && priorityLevel === PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER) {
        return new Response(
          JSON.stringify({
            allowed: false,
            status: 'pending',
            reason: 'النطاق قيد المراجعة. بصفتك مالك النطاق الأصلي، طلبك سيحصل على أولوية أعلى.',
            requires_approval: true,
            priority_level: PRIORITY_LEVELS.OFFICIAL_DOMAIN_OWNER,
            official_domain_verified: true
          } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          allowed: false,
          status: 'pending',
          reason: 'هذا النطاق قيد المراجعة من قبل مستخدم آخر',
          alternative_suggestions: generateAlternativeSuggestions(userTitle)
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. إذا كان فرد ويحتوي على كلمات قد تكون اسم شركة
    if (accountType === 'individual' || !accountType) {
      const businessKeywords = ['مكتب', 'شركة', 'مؤسسة', 'عقارية', 'للعقارات', 'realestate', 'properties'];
      for (const keyword of businessKeywords) {
        if (cleanedTitle.includes(cleanName(keyword))) {
          return new Response(
            JSON.stringify({
              allowed: false,
              status: 'pending',
              reason: 'الاسم يحتوي على مصطلحات تجارية - يحتاج موافقة',
              requires_approval: true,
              priority_level: priorityLevel,
              alternative_suggestions: generateAlternativeSuggestions(userTitle)
            } as ValidationResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // النطاق متاح
    console.log('Domain available:', userTitle, 'Priority:', priorityLevel);
    return new Response(
      JSON.stringify({
        allowed: true,
        status: 'available',
        reason: 'النطاق متاح للاستخدام ✅',
        priority_level: priorityLevel,
        official_domain_verified: officialDomainVerified
      } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating domain:', error);
    return new Response(
      JSON.stringify({ 
        allowed: false,
        status: 'error',
        reason: 'حدث خطأ أثناء التحقق' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
