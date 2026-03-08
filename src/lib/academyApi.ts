// academyApi.ts
// يتعامل مع API الأكاديمية لجلب حالة المستخدم

const ACADEMY_API_URL = 'https://pwpdrezblcgbicryydpf.supabase.co/functions/v1/get-user-status';

export interface AcademyUserStatus {
  professional_badge: boolean;
  daily_opportunities: number;
  training_completed: boolean;
}

export async function fetchUserStatus(userId: string): Promise<AcademyUserStatus | null> {
  if (!userId) return null;

  // تم إيقاف جلب البيانات من الدالة الخارجية مؤقتاً لتجنب خطأ 500 الذي يسبب توقف التطبيق (Blank Screen)
  // TODO: إعادة تفعيل هذا الكود بعد إصلاح الدالة get-user-status في المشروع الخارجي للأكاديمية
  
  return {
    professional_badge: false,
    daily_opportunities: 0,
    training_completed: false
  };
  
  /*
  try {
    const response = await fetch(ACADEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      console.error('Academy API error: HTTP', response.status);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('Academy API error:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Failed to fetch user status from academy:', error);
    return null;
  }
  */
}
