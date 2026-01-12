/**
 * قاعدة المعرفة الكاملة للمساعد الذكي - Wasata AI
 * يحتوي على شرح مفصل لكل صفحة وميزة في التطبيق
 */

export interface PageKnowledge {
  path: string;
  name: string;
  arabicName: string;
  description: string;
  mainPurpose: string;
  howToUse: string[];
  tips: string[];
  relatedPages: string[];
  commonQuestions: { question: string; answer: string }[];
  fields?: { name: string; description: string; tips?: string }[];
  buttons?: { name: string; action: string }[];
}

// قاعدة معرفة الصفحات
export const pagesKnowledge: Record<string, PageKnowledge> = {
  // === صفحة نشر الإعلان ===
  'publish-ad': {
    path: '/app/publish-ad',
    name: 'Publish Ad',
    arabicName: 'نشر إعلان',
    description: 'صفحة نشر إعلان عقاري جديد على منصتك الخاصة',
    mainPurpose: 'تسجيل معلومات العقار ونشره على منصتك للعملاء والزوار',
    howToUse: [
      'ابدأ بتعبئة البيانات الأساسية: العنوان، نوع العقار، السعر',
      'حدد الموقع على الخريطة أو اكتب العنوان',
      'أضف الصور والفيديوهات للعقار',
      'أكمل التفاصيل الإضافية: المساحة، الغرف، المميزات',
      'اضغط على "نشر الإعلان" لإتمام العملية'
    ],
    tips: [
      'الصور الواضحة تزيد من فرص البيع بنسبة 40%',
      'اكتب وصفاً مفصلاً يوضح مميزات العقار',
      'تأكد من صحة رقم جوال المالك للتواصل',
      'رقم الترخيص الإعلاني ضروري للنشر الرسمي'
    ],
    relatedPages: ['منصتي', 'العروض', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'كيف أضيف صور للإعلان؟',
        answer: 'اضغط على منطقة الصور أو اسحب الصور مباشرة لرفعها. يمكنك رفع حتى 10 صور.'
      },
      {
        question: 'ما هو رقم الترخيص الإعلاني؟',
        answer: 'رقم يصدر من الهيئة العامة للعقار (فال) ويجب إضافته لجميع الإعلانات العقارية.'
      },
      {
        question: 'أين سيظهر إعلاني بعد النشر؟',
        answer: 'سيظهر في تبويب "العروض" في لوحة التحكم، وفي "منصتي" للعملاء والزوار.'
      }
    ],
    fields: [
      { name: 'عنوان الإعلان', description: 'اسم مختصر وجذاب للعقار', tips: 'استخدم كلمات مثل: فاخرة، مطلة، قريبة من...' },
      { name: 'نوع العقار', description: 'شقة، فيلا، أرض، عمارة، مكتب...', tips: 'اختر النوع الصحيح لتظهر للباحثين المناسبين' },
      { name: 'السعر', description: 'سعر البيع أو الإيجار', tips: 'السعر التنافسي يجذب المزيد من المشاهدات' },
      { name: 'المدينة والحي', description: 'موقع العقار بالتفصيل', tips: 'الموقع الدقيق يوفر وقتك ووقت العميل' },
      { name: 'رقم جوال المالك', description: 'للتواصل وإنشاء بطاقة عميل', tips: 'سيتم ربطه بنظام إدارة العملاء تلقائياً' }
    ],
    buttons: [
      { name: 'نشر الإعلان', action: 'ينشر العرض على منصتك ويضيفه لتبويب العروض' },
      { name: 'حفظ كمسودة', action: 'يحفظ البيانات بدون نشر للإكمال لاحقاً' }
    ]
  },

  // === منصتي ===
  'platform': {
    path: '/app/platform',
    name: 'My Platform',
    arabicName: 'منصتي',
    description: 'الصفحة العامة التي يراها الجمهور والعملاء',
    mainPurpose: 'عرض عروضك العقارية للعملاء بشكل احترافي مع بطاقة أعمالك الرقمية',
    howToUse: [
      'رابط منصتك: wasata.com/اسمك',
      'يظهر فيها الهيدر من بطاقة أعمالك الرقمية',
      'تعرض العروض المنشورة بطرق عرض مختلفة',
      'يمكن للعملاء التواصل معك مباشرة'
    ],
    tips: [
      'شارك رابط منصتك في واتساب وتويتر',
      'تأكد من تحديث بطاقة أعمالك بمعلومات صحيحة',
      'العروض المثبتة تظهر أولاً'
    ],
    relatedPages: ['العروض', 'بطاقة الأعمال الرقمية'],
    commonQuestions: [
      {
        question: 'كيف أغير شكل عرض العقارات؟',
        answer: 'يمكنك اختيار: عرض مباشر، تجميع بالأحياء، أو هرمي (مدن ← أحياء ← عروض)'
      },
      {
        question: 'كيف أحصل على رابط منصتي؟',
        answer: 'رابطك هو wasata.com/ + اسم النطاق الخاص بك من إعدادات بطاقة الأعمال'
      }
    ]
  },

  // === العروض (لوحة التحكم) ===
  'offers': {
    path: '/app/offers',
    name: 'Offers Dashboard',
    arabicName: 'العروض',
    description: 'لوحة تحكم الوسيط في العروض المنشورة',
    mainPurpose: 'إدارة العروض: إظهار، إخفاء، مشاركة، ومتابعة الإحصائيات',
    howToUse: [
      'اضغط على أي عرض لرؤية التفاصيل الكاملة',
      'استخدم زر الإخفاء لإخفاء عرض مؤقتاً',
      'اضغط على المشاركة لنسخ الرابط أو الإرسال',
      'شاهد عدد الزوار المباشرين لكل عرض'
    ],
    tips: [
      'العروض المثبتة تظهر أولاً للعملاء',
      'الإحصائيات تساعدك على معرفة العروض الأكثر جذباً',
      'يمكنك تعديل أي عرض من هنا'
    ],
    relatedPages: ['منصتي', 'نشر إعلان', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'ما الفرق بين الإخفاء والحذف؟',
        answer: 'الإخفاء: العرض موجود لكن غير مرئي للجمهور. الحذف: ينقل للمحذوفات ويمكن استعادته.'
      },
      {
        question: 'ماذا تعني تبويبات العرض الأربعة؟',
        answer: '1) معلومات أساسية 2) معلومات المالك مع زر للـCRM 3) معلومات الصك 4) معلومات التأجير'
      }
    ],
    fields: [
      { name: 'تبويب المعلومات الأساسية', description: 'نوع العقار، السعر، الموقع، الوصف' },
      { name: 'تبويب المالك', description: 'بيانات مالك العقار مع رابط لبطاقته في CRM' },
      { name: 'تبويب الصك', description: 'رقم الصك، تاريخه، نوع الملكية، المساحة المسجلة' },
      { name: 'تبويب التأجير', description: 'للعقارات المؤجرة: قيمة الإيجار، مدة العقد، الشروط' }
    ]
  },

  // === الطلبات (الفرص الذكية) ===
  'requests': {
    path: '/app/requests',
    name: 'Requests',
    arabicName: 'الطلبات',
    description: 'طلبات العملاء الباحثين عن عقارات',
    mainPurpose: 'تجميع طلبات العملاء ومطابقتها مع العروض المتاحة (الفرص الذكية)',
    howToUse: [
      'تظهر هنا جميع طلبات الشراء والإيجار',
      'النظام يقارن الطلبات بالعروض تلقائياً',
      'عند التطابق، تصلك إشعارات بالفرص الذكية',
      'يمكنك تحويل الطلب إلى عرض مباشرة'
    ],
    tips: [
      'الفرص الذكية توفر عليك وقت البحث',
      'تابع الإشعارات للحصول على فرص جديدة',
      'اربط الطلبات بعملاء من CRM للمتابعة'
    ],
    relatedPages: ['العروض', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'كيف تعمل الفرص الذكية؟',
        answer: 'النظام يقارن متطلبات الباحثين (موقع، سعر، مساحة) مع عروضك، وينبهك عند التطابق.'
      },
      {
        question: 'كيف أحول طلب إلى عرض؟',
        answer: 'من تفاصيل الطلب، اضغط "تحويل إلى عرض" لاستيراد البيانات تلقائياً.'
      }
    ]
  },

  // === إدارة العملاء CRM ===
  'crm': {
    path: '/app/crm',
    name: 'CRM',
    arabicName: 'إدارة العملاء',
    description: 'نظام Kanban متكامل لإدارة العملاء والمتابعة',
    mainPurpose: 'تتبع العملاء من أول تواصل حتى إتمام الصفقة',
    howToUse: [
      'أعمدة Kanban: جديد، متابعة، مكتمل، متعثر...',
      'اسحب البطاقات بين الأعمدة لتحديث الحالة',
      'اضغط على البطاقة لفتح التفاصيل الكاملة',
      'استخدم التاجات والألوان للتصنيف السريع'
    ],
    tips: [
      'العمود الأول مرتبط بسجل المكالمات تلقائياً',
      'الألوان العلوية تدل على نوع العميل (مالك/باحث/زميل)',
      'الألوان السفلية تدل على درجة الاهتمام',
      'يمكنك إضافة زميل لمتابعة عميل معين'
    ],
    relatedPages: ['العروض', 'الطلبات', 'التقويم'],
    commonQuestions: [
      {
        question: 'ما معنى ألوان البطاقات؟',
        answer: 'أزرق: مالك عقار، أخضر: باحث عن عقار، أصفر: زميل/فريق، أحمر: عميل متعثر'
      },
      {
        question: 'كيف أضيف زميل لمتابعة عميل؟',
        answer: 'من أيقونة "إضافة زميل" في البطاقة، يمكنك إضافة أحد أعضاء الفريق للمتابعة المشتركة.'
      },
      {
        question: 'ما هي تبويبات صفحة تفاصيل العميل؟',
        answer: 'عام (المعلومات الأساسية)، عقارات منشورة، عروض، طلبات، عروض أسعار، حاسبة تمويل، تنبيهات'
      }
    ],
    fields: [
      { name: 'البحث', description: 'ابحث بالاسم، التاجات، نوع العميل، درجة الاهتمام' },
      { name: 'تصدير', description: 'تصدير البيانات كـ Excel, PDF, CSV' },
      { name: 'استعادة', description: 'استعادة العملاء المحذوفين أو النسخ الاحتياطية' },
      { name: 'تزامن', description: 'مزامنة البيانات مع السحابة والأجهزة الأخرى' }
    ]
  },

  // === بطاقة الأعمال الرقمية ===
  'business-card': {
    path: '/app/business-card',
    name: 'Digital Business Card',
    arabicName: 'بطاقة الأعمال الرقمية',
    description: 'بطاقتك الرقمية المهنية للتواصل والتسويق',
    mainPurpose: 'عرض هويتك المهنية ومعلومات التواصل بشكل احترافي',
    howToUse: [
      'اضغط على زر التحرير في أعلى الصفحة',
      'أكمل المعلومات الأساسية والتحقق',
      'أضف صورة البروفايل والشعار وخلفية الهيدر',
      'حدد أوقات الدوام الرسمي',
      'انشر البطاقة لمشاركتها مع العملاء'
    ],
    tips: [
      'تظهر البطاقة في هيدر منصتك للعملاء',
      'الترخيص من فال يزيد ثقة العملاء',
      'رابط البطاقة: wasata.com/اسمك/card'
    ],
    relatedPages: ['منصتي', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'ما هو النطاق (Slug)؟',
        answer: 'اسم فريد يظهر في رابط منصتك: wasata.com/الاسم. لا يقبل الاسم الأول فقط أو الأحرف الخاصة.'
      },
      {
        question: 'كيف أتحقق من رخصة فال؟',
        answer: 'أدخل رقم الترخيص وسيتم التحقق تلقائياً من الهيئة العامة للعقار.'
      },
      {
        question: 'ما هي الأزرار التفاعلية؟',
        answer: 'منصتي، الموقع الرسمي، زيارة الموقع، اتصال، واتساب، إيميل، تحميل vCard، إرسال عرض، إرسال طلب، حاسبة تمويل، إرسال موعد'
      }
    ],
    fields: [
      { name: 'النوع', description: 'فرد، مكتب، أو شركة', tips: 'يحدد المعلومات المطلوبة' },
      { name: 'رخصة فال', description: 'رقم الترخيص من الهيئة العامة للعقار', tips: 'مرتبط بـ API للتحقق التلقائي' },
      { name: 'السجل التجاري', description: 'للمكاتب والشركات', tips: 'يتم التحقق من وزارة التجارة' },
      { name: 'أوقات الدوام', description: 'من الأحد للسبت، فترة أو فترتين', tips: 'تظهر للعملاء في البطاقة' },
      { name: 'وصف عني', description: 'نبذة مختصرة عنك', tips: 'حد أقصى 500 حرف' }
    ]
  },

  // === التقويم والمواعيد ===
  'calendar': {
    path: '/app/calendar',
    name: 'Calendar',
    arabicName: 'التقويم',
    description: 'إدارة المواعيد والمعاينات والاجتماعات',
    mainPurpose: 'تنظيم مواعيدك مع العملاء ومتابعتها',
    howToUse: [
      'أضف موعد جديد من زر الإضافة',
      'حدد نوع الموعد: معاينة، اتصال، اجتماع',
      'أدخل بيانات العميل والوقت',
      'ستصلك تنبيهات قبل الموعد'
    ],
    tips: [
      'المواعيد المحجوزة تظهر مغلقة للعملاء الجدد',
      'نوع "اتصال" متاح دائماً بدون حجز',
      'يمكن للعملاء حجز مواعيد من بطاقتك الرقمية'
    ],
    relatedPages: ['بطاقة الأعمال الرقمية', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'كيف يحجز العميل موعد؟',
        answer: 'من بطاقتك الرقمية، يضغط "إرسال موعد"، يحدد النوع والوقت، وترسل لك إشعار.'
      }
    ]
  },

  // === الإعدادات ===
  'settings': {
    path: '/app/settings',
    name: 'Settings',
    arabicName: 'الإعدادات',
    description: 'إعدادات الحساب والتطبيق',
    mainPurpose: 'تخصيص التطبيق حسب احتياجاتك',
    howToUse: [
      'إعدادات الإشعارات والتنبيهات',
      'تخصيص شريط التنقل السفلي',
      'إدارة البيانات والنسخ الاحتياطية',
      'إعدادات الفرص الذكية'
    ],
    tips: [
      'فعّل الإشعارات الفورية للفرص الذكية',
      'خصص الأزرار السريعة حسب استخدامك',
      'احتفظ بنسخة احتياطية دورياً'
    ],
    relatedPages: [],
    commonQuestions: []
  },

  // === لوحة التحكم ===
  'dashboard': {
    path: '/app/dashboard',
    name: 'Dashboard',
    arabicName: 'لوحة التحكم',
    description: 'الصفحة الرئيسية مع نظرة عامة على نشاطك',
    mainPurpose: 'رؤية سريعة لأهم الإحصائيات والأنشطة',
    howToUse: [
      'شاهد إحصائيات العروض والمشاهدات',
      'تابع آخر الأنشطة والإشعارات',
      'انتقل سريعاً لأي قسم من الأقسام'
    ],
    tips: [
      'راجع الإحصائيات يومياً لمتابعة الأداء',
      'انتبه للإشعارات الجديدة'
    ],
    relatedPages: ['العروض', 'الطلبات', 'إدارة العملاء'],
    commonQuestions: [
      {
        question: 'ماذا تعني الأرقام في الإحصائيات؟',
        answer: 'عدد العروض النشطة، المشاهدات، العملاء في CRM، والصفقات المكتملة.'
      }
    ]
  }
};

// رسائل المساعد حسب السياق
export const contextualMessages: Record<string, { triggers: string[]; messages: string[] }> = {
  welcomeNew: {
    triggers: ['first_visit', 'new_user'],
    messages: [
      'أهلاً بك في وساطة! 👋 أنا مساعدك الذكي. أقدر أساعدك في أي شي تحتاجه.',
      'مرحباً! أنا هنا لمساعدتك. إذا واجهت أي صعوبة، اسألني!'
    ]
  },
  formHelp: {
    triggers: ['incomplete_form', 'freeze_on_form'],
    messages: [
      'لاحظت إنك متوقف عند تعبئة البيانات. هل تحتاج مساعدة في حقل معين؟',
      'تعبئة البيانات سهلة! ابدأ بالمعلومات الأساسية وأكمل الباقي.'
    ]
  },
  pricing: {
    triggers: ['price_field', 'pricing_help'],
    messages: [
      'للمساعدة في التسعير، يمكنك استخدام الحاسبة الذكية أو مراجعة أسعار العقارات المشابهة.',
      'السعر التنافسي يجذب المزيد من المشاهدات. راجع الأسعار في المنطقة.'
    ]
  },
  publishingSuccess: {
    triggers: ['publish_complete'],
    messages: [
      'تم نشر إعلانك بنجاح! 🎉 يمكنك مشاركته من تبويب العروض.',
      'رائع! إعلانك الآن متاح للعملاء على منصتك.'
    ]
  }
};

// دالة للحصول على معرفة الصفحة
export function getPageKnowledge(pagePath: string): PageKnowledge | null {
  const pathKey = Object.keys(pagesKnowledge).find(key => 
    pagePath.includes(key) || pagesKnowledge[key].path.includes(pagePath)
  );
  return pathKey ? pagesKnowledge[pathKey] : null;
}

// دالة للحصول على إجابة سؤال شائع
export function findAnswer(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  
  for (const pageKey of Object.keys(pagesKnowledge)) {
    const page = pagesKnowledge[pageKey];
    for (const qa of page.commonQuestions) {
      if (lowerQuestion.includes(qa.question.toLowerCase()) ||
          qa.question.toLowerCase().includes(lowerQuestion)) {
        return qa.answer;
      }
    }
  }
  return null;
}

// دالة لتوليد نصائح حسب الصفحة
export function getPageTips(pagePath: string): string[] {
  const knowledge = getPageKnowledge(pagePath);
  return knowledge?.tips || [];
}

// دالة لتوليد رسالة مساعدة سياقية
export function generateContextualHelp(pagePath: string, context: {
  formProgress?: number;
  currentField?: string;
  timeOnPage?: number;
  triggerReason?: string;
}): string {
  const knowledge = getPageKnowledge(pagePath);
  
  if (!knowledge) {
    return 'مرحباً! كيف أقدر أساعدك اليوم؟';
  }

  // رسائل حسب التقدم في النموذج
  if (context.formProgress !== undefined) {
    if (context.formProgress < 20) {
      return `أهلاً! أنت في صفحة ${knowledge.arabicName}. ${knowledge.howToUse[0]}`;
    } else if (context.formProgress < 50) {
      return `ممتاز! أنت في منتصف الطريق. ${knowledge.tips[0] || 'واصل التعبئة!'}`;
    } else if (context.formProgress >= 80) {
      return 'رائع! أوشكت على الانتهاء. راجع البيانات ثم اضغط على نشر.';
    }
  }

  // رسائل حسب الحقل الحالي
  if (context.currentField && knowledge.fields) {
    const field = knowledge.fields.find(f => 
      context.currentField?.includes(f.name) || f.name.includes(context.currentField || '')
    );
    if (field?.tips) {
      return `نصيحة لـ "${field.name}": ${field.tips}`;
    }
  }

  // رسائل حسب سبب الظهور
  if (context.triggerReason === 'freeze') {
    return `يبدو إنك متوقف قليلاً. ${knowledge.tips[0] || 'هل تحتاج مساعدة؟'}`;
  }

  // رسالة افتراضية
  return `مرحباً! أنا هنا لمساعدتك في ${knowledge.arabicName}. ${knowledge.mainPurpose}`;
}
