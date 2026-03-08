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
}
