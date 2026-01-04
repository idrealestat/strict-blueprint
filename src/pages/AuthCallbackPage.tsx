import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type CallbackState = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // استمع لتغيير حالة المصادقة أولاً
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Callback] onAuthStateChange:', event, session?.user?.email);
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session) {
        setState('success');
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'جاري تحويلك للوحة التحكم...',
        });
        setTimeout(() => {
          if (isMounted) {
            navigate('/app/businesscard/edit', { replace: true });
          }
        }, 500);
      }
    });

    // تحقق من الجلسة الحالية
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Callback] getSession:', session?.user?.email, error);

        if (!isMounted) return;

        if (session) {
          setState('success');
          toast({
            title: 'تم تسجيل الدخول بنجاح',
            description: 'جاري تحويلك للوحة التحكم...',
          });
          setTimeout(() => {
            if (isMounted) {
              navigate('/app/businesscard/edit', { replace: true });
            }
          }, 500);
        } else {
          // انتظر قليلاً لأن Supabase يعالج الـ hash/token من URL تلقائياً
          setTimeout(() => {
            if (isMounted && state === 'loading') {
              setErrorMessage('لم يتم العثور على جلسة نشطة');
              setState('error');
            }
          }, 3000);
        }
      } catch (err: any) {
        console.error('[Callback] Error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'حدث خطأ غير متوقع');
          setState('error');
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="pt-8 pb-8">
            {state === 'loading' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h1 className="text-xl font-bold mb-2">جاري تسجيل الدخول...</h1>
                <p className="text-muted-foreground">يرجى الانتظار</p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold mb-2">تم تسجيل الدخول</h1>
                <p className="text-muted-foreground">جاري التوجيه...</p>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-xl font-bold mb-2">تعذر تسجيل الدخول</h1>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <Button variant="outline" onClick={() => navigate('/app/login')}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
