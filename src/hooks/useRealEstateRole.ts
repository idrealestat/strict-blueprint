/**
 * Hook للتحقق من الدور العقاري (وسيط - مالك - عميل)
 * منفصل عن أدوار النظام (owner - admin - member)
 * 
 * التوافق: المبدأ 2 - تصنيف المستخدمين والصلاحيات
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type RealEstateRole = 'broker' | 'landlord' | 'client';

interface RealEstateRoleData {
  role: RealEstateRole;
  falLicenseNumber?: string;
  falLicenseExpiry?: string;
  isActive: boolean;
  verifiedAt?: string;
}

interface UseRealEstateRoleReturn {
  realEstateRole: RealEstateRole | null;
  roleData: RealEstateRoleData | null;
  loading: boolean;
  isBroker: boolean;
  isLandlord: boolean;
  isClient: boolean;
  hasRealEstateRole: boolean;
  setRole: (role: RealEstateRole, falLicense?: string) => Promise<boolean>;
  canPerformAction: (action: RealEstateAction) => boolean;
}

// الإجراءات المسموحة حسب الدور
export type RealEstateAction =
  | 'create_listing'       // إنشاء عرض
  | 'edit_listing'         // تعديل عرض
  | 'delete_listing'       // حذف عرض
  | 'publish_listing'      // نشر عرض
  | 'view_client_data'     // مشاهدة بيانات العملاء
  | 'create_request'       // إنشاء طلب
  | 'accept_request'       // قبول طلب
  | 'negotiate_price'      // التفاوض على السعر
  | 'sign_contract'        // توقيع عقد
  | 'receive_commission'   // استلام عمولة
  | 'generate_ai_content'; // توليد محتوى بالذكاء الاصطناعي

// صلاحيات كل دور
const ROLE_PERMISSIONS: Record<RealEstateRole, RealEstateAction[]> = {
  broker: [
    'create_listing',
    'edit_listing',
    'delete_listing',
    'publish_listing',
    'view_client_data',
    'create_request',
    'accept_request',
    'negotiate_price',
    'sign_contract',
    'receive_commission',
    'generate_ai_content',
  ],
  landlord: [
    'create_listing',
    'edit_listing',
    'delete_listing',
    'publish_listing',
    'accept_request',
    'negotiate_price',
    'sign_contract',
    'generate_ai_content',
  ],
  client: [
    'create_request',
    'negotiate_price',
    'sign_contract',
  ],
};

export function useRealEstateRole(): UseRealEstateRoleReturn {
  const { user, isAuthenticated } = useAuth();
  const [realEstateRole, setRealEstateRole] = useState<RealEstateRole | null>(null);
  const [roleData, setRoleData] = useState<RealEstateRoleData | null>(null);
  const [loading, setLoading] = useState(true);

  // جلب الدور العقاري
  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setRealEstateRole(null);
      setRoleData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // استخدام الدالة المخصصة
      const { data: roleResult } = await supabase
        .rpc('get_real_estate_role', { _user_id: user.id });

      if (roleResult) {
        setRealEstateRole(roleResult as RealEstateRole);
        
        // جلب التفاصيل الكاملة
        const { data: fullData } = await supabase
          .from('real_estate_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (fullData) {
          setRoleData({
            role: fullData.role as RealEstateRole,
            falLicenseNumber: fullData.fal_license_number,
            falLicenseExpiry: fullData.fal_license_expiry,
            isActive: fullData.is_active,
            verifiedAt: fullData.verified_at,
          });
        }
      } else {
        // المستخدم الجديد يكون "عميل" افتراضياً
        setRealEstateRole(null);
        setRoleData(null);
      }
    } catch (error) {
      console.error('Error fetching real estate role:', error);
      setRealEstateRole(null);
      setRoleData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRole();
    } else {
      setRealEstateRole(null);
      setRoleData(null);
      setLoading(false);
    }
  }, [isAuthenticated, fetchRole]);

  // تعيين الدور العقاري
  const setRole = async (role: RealEstateRole, falLicense?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('real_estate_roles')
        .upsert({
          user_id: user.id,
          role,
          fal_license_number: role === 'broker' ? falLicense : null,
          is_active: true,
        }, {
          onConflict: 'user_id,role',
        });

      if (error) {
        console.error('Error setting real estate role:', error);
        return false;
      }

      await fetchRole();
      return true;
    } catch (error) {
      console.error('Exception setting real estate role:', error);
      return false;
    }
  };

  // التحقق من صلاحية إجراء معين
  const canPerformAction = (action: RealEstateAction): boolean => {
    if (!realEstateRole) {
      // إذا لم يكن له دور محدد، يُعامل كعميل
      return ROLE_PERMISSIONS.client.includes(action);
    }
    return ROLE_PERMISSIONS[realEstateRole].includes(action);
  };

  return {
    realEstateRole,
    roleData,
    loading,
    isBroker: realEstateRole === 'broker',
    isLandlord: realEstateRole === 'landlord',
    isClient: realEstateRole === 'client' || !realEstateRole,
    hasRealEstateRole: !!realEstateRole,
    setRole,
    canPerformAction,
  };
}
