import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessCardGuardProps {
  children: React.ReactNode;
}

/**
 * Guard يتحقق من اكتمال إعداد بطاقة الأعمال
 * 
 * الشروط:
 * 1. إذا غير مسجل → /app/login
 * 2. إذا مسجل:
 *    - إذا لا يوجد سجل business_cards → إنشاء سجل مبدئي + توجيه /app/businesscard/edit
 *    - إذا slug = NULL أو فارغ → توجيه /app/businesscard/edit
 *    - إذا slug موجود → السماح بالدخول
 */
export default function BusinessCardGuard({ children }: BusinessCardGuardProps) {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasValidSlug, setHasValidSlug] = useState(false);

  useEffect(() => {
    const checkBusinessCard = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated || !user) {
        setChecking(false);
        return;
      }

      try {
        // استعلام business_cards للمستخدم الحالي
        const { data: businessCard, error } = await supabase
          .from('business_cards')
          .select('id, slug, published')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking business card:', error);
          setChecking(false);
          return;
        }

        // إذا لا يوجد سجل → إنشاء سجل مبدئي
        if (!businessCard) {
          console.log('No business card found, creating initial record...');
          const { error: insertError } = await supabase
            .from('business_cards')
            .insert({
              user_id: user.id,
              slug: null,
              published: false,
              data: {
                name: '',
                phone: '',
                email: user.email || '',
                company: '',
                title: ''
              }
            });

          if (insertError) {
            console.error('Error creating business card:', insertError);
          }
          
          // لا يوجد slug → توجيه لصفحة التحرير
          setHasValidSlug(false);
          setChecking(false);
          return;
        }

        // التحقق من وجود slug صالح (غير NULL وغير فارغ)
        const slugExists = businessCard.slug && businessCard.slug.trim() !== '';
        setHasValidSlug(slugExists);
        setChecking(false);

      } catch (err) {
        console.error('Error in BusinessCardGuard:', err);
        setChecking(false);
      }
    };

    checkBusinessCard();
  }, [isAuthenticated, user, authLoading]);

  // Loading state
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // غير مسجل → /app/login
  if (!isAuthenticated) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // slug غير موجود أو فارغ → /app/businesscard/edit
  if (!hasValidSlug) {
    return <Navigate to="/app/businesscard/edit" replace />;
  }

  // slug موجود → السماح بالدخول
  return <>{children}</>;
}
