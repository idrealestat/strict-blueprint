/**
 * فلتر المحتوى العقاري المولَّد
 * يمنع التضليل والمبالغة والادعاءات غير القابلة للتحقق
 * 
 * التوافق: المبدأ 3 - ضبط المحتوى العقاري المولَّد
 */

// قائمة الكلمات المبالغ فيها الممنوعة
const PROHIBITED_PHRASES = [
  // ادعاءات مطلقة
  'أفضل عقار',
  'أرخص سعر',
  'فرصة لن تتكرر',
  'حصري جداً',
  'مضمون 100%',
  'أعلى عائد',
  'استثمار مضمون',
  'الأفضل في السوق',
  'لا مثيل له',
  'فريد من نوعه',
  
  // ادعاءات مالية غير موثقة
  'ربح مؤكد',
  'عائد سنوي مضمون',
  'زيادة قيمة مؤكدة',
  'لا خسارة',
  
  // مبالغات
  'أسطوري',
  'خيالي',
  'مذهل جداً',
  'لا يصدق',
  'ساحر',
  'أعجوبة',
];

// تحذيرات يجب إضافتها
const REQUIRED_DISCLAIMERS = {
  price: 'السعر المقترح تقريبي وقد يختلف عن السعر الفعلي',
  description: 'هذا الوصف مُولَّد بالذكاء الاصطناعي ويجب مراجعته قبل النشر',
  investment: 'الاستثمار العقاري يحمل مخاطر والعوائد غير مضمونة',
};

export interface FilterResult {
  isClean: boolean;
  filteredContent: string;
  removedPhrases: string[];
  warnings: string[];
}

/**
 * فلترة المحتوى المولَّد
 */
export function filterGeneratedContent(content: string): FilterResult {
  if (!content) {
    return {
      isClean: true,
      filteredContent: '',
      removedPhrases: [],
      warnings: [],
    };
  }

  let filteredContent = content;
  const removedPhrases: string[] = [];
  const warnings: string[] = [];

  // إزالة العبارات الممنوعة
  for (const phrase of PROHIBITED_PHRASES) {
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(filteredContent)) {
      removedPhrases.push(phrase);
      filteredContent = filteredContent.replace(regex, '');
    }
  }

  // تنظيف المسافات الزائدة
  filteredContent = filteredContent.replace(/\s+/g, ' ').trim();

  // إضافة تحذيرات إذا كان المحتوى يحتوي على ادعاءات مالية
  if (/عائد|ربح|استثمار|زيادة قيمة/i.test(content)) {
    warnings.push(REQUIRED_DISCLAIMERS.investment);
  }

  return {
    isClean: removedPhrases.length === 0,
    filteredContent,
    removedPhrases,
    warnings,
  };
}

/**
 * التحقق من أن المحتوى اقتراحي وليس ملزم
 */
export function addSuggestionDisclaimer(content: string, type: 'price' | 'description'): string {
  const disclaimer = REQUIRED_DISCLAIMERS[type];
  
  // لا تضف إذا كان موجوداً
  if (content.includes(disclaimer)) {
    return content;
  }

  return `${content}\n\n⚠️ ${disclaimer}`;
}

/**
 * تسجيل محتوى مولَّد في سجل التدقيق
 */
export interface AuditLogEntry {
  entityType: 'listing' | 'request' | 'business_card' | 'ai_output';
  entityId: string;
  actionType: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'ai_generate';
  performedBy: string;
  performedByRole?: 'broker' | 'landlord' | 'client';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  changeReason?: string;
  isAiGenerated: boolean;
  aiModelUsed?: string;
}

export async function logContentAudit(
  supabase: any,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await supabase.from('content_audit_log').insert({
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action_type: entry.actionType,
      performed_by: entry.performedBy,
      performed_by_role: entry.performedByRole,
      field_changed: entry.fieldChanged,
      old_value: entry.oldValue,
      new_value: entry.newValue,
      change_reason: entry.changeReason,
      is_ai_generated: entry.isAiGenerated,
      ai_model_used: entry.aiModelUsed,
    });
  } catch (error) {
    console.error('Failed to log content audit:', error);
    // لا نوقف العملية بسبب فشل التسجيل
  }
}

/**
 * الحصول على قائمة العبارات الممنوعة (للاستخدام في Edge Functions)
 */
export function getProhibitedPhrases(): string[] {
  return [...PROHIBITED_PHRASES];
}

/**
 * الحصول على الإفصاحات المطلوبة
 */
export function getRequiredDisclaimers(): typeof REQUIRED_DISCLAIMERS {
  return { ...REQUIRED_DISCLAIMERS };
}
