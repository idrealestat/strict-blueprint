import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BusinessCardGuardProps {
  children: React.ReactNode;
}

type GuardState = 
  | 'loading'              // جاري التحقق
  | 'not_authenticated'    // غير مسجل
  | 'not_verified'         // مسجل لكن البريد غير موثق
  | 'no_slug'              // مسجل ولكن بدون slug
  | 'has_slug'             // مسجل ولديه slug صالح
  | 'error';               // خطأ

/**
 * BusinessCardGuard - Production-safe
 * 
 * يمنع دخول /app/dashboard وباقي صفحات /app/* حتى:
 * 1. المستخدم مسجل
 * 2. يوجد سجل business_cards
 * 3. slug غير فارغ وغير NULL
 */
export default function BusinessCardGuard({ children }: BusinessCardGuardProps) {
  const { isAuthenticated, user, loading: authLoading, isEmailVerified } = useAuth();
  const location = useLocation();
  
  const [guardState, setGuardState] = useState<GuardState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Ref لمنع التكرار في StrictMode
  const checkInFlightRef = useRef(false);
  const lastCheckedUserIdRef = useRef<string | null>(null);

  const checkBusinessCard = useCallback(async (userId: string) => {
    // منع التكرار
    if (checkInFlightRef.current) {
      console.log('[BusinessCardGuard] Check already in flight, skipping...');
      return;
    }
    
    // تجنب إعادة الفحص لنفس المستخدم
    if (lastCheckedUserIdRef.current === userId && guardState !== 'loading') {
      console.log('[BusinessCardGuard] Already checked for this user, skipping...');
      return;
    }

    checkInFlightRef.current = true;
    console.log('[BusinessCardGuard] Checking business card for user:', userId);

    try {
      // 1. استعلام business_cards
      const { data: businessCard, error: selectError } = await supabase
        .from('business_cards')
        .select('id, slug, published')
        .eq('user_id', userId)
        .maybeSingle();

      // فحص الخطأ أولاً
      if (selectError) {
        console.error('[BusinessCardGuard] Select error:', selectError);
        setErrorMessage(`خطأ في استرجاع البيانات: ${selectError.message}`);
        setGuardState('error');
        checkInFlightRef.current = false;
        return;
      }

      // 2. إذا لا يوجد سجل -> إنشاء سجل مبدئي
      if (!businessCard) {
        console.log('[BusinessCardGuard] No business card found, creating initial record...');
        
        const { error: insertError } = await supabase
          .from('business_cards')
          .insert({
            user_id: userId,
            slug: null,
            published: false,
            data: {
              name: '',
              phone: '',
              email: '',
              company: '',
              title: ''
            }
          });

        if (insertError) {
          // تجاهل خطأ duplicate (في حال StrictMode أو race condition)
          if (insertError.code === '23505') {
            console.log('[BusinessCardGuard] Duplicate insert ignored (StrictMode safe)');
          } else {
            console.error('[BusinessCardGuard] Insert error:', insertError);
            setErrorMessage(`خطأ في إنشاء السجل: ${insertError.message}`);
            setGuardState('error');
            checkInFlightRef.current = false;
            return;
          }
        }

        // سجل جديد بدون slug -> توجيه لصفحة التحرير
        lastCheckedUserIdRef.current = userId;
        setGuardState('no_slug');
        checkInFlightRef.current = false;
        return;
      }

      // 3. التحقق من slug
      const hasValidSlug = businessCard.slug && businessCard.slug.trim() !== '';
      
      lastCheckedUserIdRef.current = userId;
      
      if (hasValidSlug) {
        console.log('[BusinessCardGuard] Valid slug found:', businessCard.slug);
        setGuardState('has_slug');
      } else {
        console.log('[BusinessCardGuard] No valid slug, redirecting to edit...');
        setGuardState('no_slug');
      }

    } catch (err) {
      console.error('[BusinessCardGuard] Unexpected error:', err);
      setErrorMessage('حدث خطأ غير متوقع');
      setGuardState('error');
    } finally {
      checkInFlightRef.current = false;
    }
  }, [guardState]);

  useEffect(() => {
    // انتظار انتهاء تحميل Auth
    if (authLoading) {
      setGuardState('loading');
      return;
    }

    // غير مسجل
    if (!isAuthenticated || !user) {
      setGuardState('not_authenticated');
      return;
    }

    // مسجل لكن البريد غير موثق
    if (!isEmailVerified) {
      setGuardState('not_verified');
      return;
    }

    // مسجل وموثق -> فحص business_cards
    checkBusinessCard(user.id);
  }, [authLoading, isAuthenticated, user, isEmailVerified, checkBusinessCard]);

  // عرض رسالة الخطأ
  useEffect(() => {
    if (guardState === 'error' && errorMessage) {
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [guardState, errorMessage]);

  // ======= Render based on state =======

  // 1. Loading
  if (guardState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  // 2. Not authenticated
  if (guardState === 'not_authenticated') {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // 2.5. Not verified - توجيه مع رسالة
  if (guardState === 'not_verified') {
    toast({
      title: 'البريد غير موثق',
      description: 'يرجى توثيق البريد عبر الرابط المرسل إليك',
      variant: 'destructive',
    });
    return <Navigate to="/app/login" state={{ from: location, needsVerification: true }} replace />;
  }

  // 3. Error - redirect to businesscard/edit with error state
  if (guardState === 'error') {
    return <Navigate to="/app/businesscard/edit" state={{ error: errorMessage }} replace />;
  }

  // 4. No slug - redirect to businesscard/edit
  if (guardState === 'no_slug') {
    return <Navigate to="/app/businesscard/edit" replace />;
  }

  // 5. Has valid slug - allow access
  return <>{children}</>;
}
