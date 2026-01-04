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

    const handleSuccess = () => {
      if (!isMounted) return;
      setState('success');
      toast({
        title: 'تم توثيق بريدك وتسجيل الدخول بنجاح',
        description: 'جاري تحويلك للوحة التحكم...',
      });
      setTimeout(() => {
        navigate('/app/businesscard/edit', { replace: true });
      }, 800);
    };

    const handleError = (message: string) => {
      if (!isMounted) return;
      setErrorMessage(message);
      setState('error');
    };

    // 1) استمع للأحداث (مهم لأن بعض روابط Magic Link تُنشئ الجلسة عبر حدث SIGNED_IN)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        handleSuccess();
      }
    });

    // 2) حاول التقاط الجلسة / تبادل الكود (PKCE) إن وجد
    const run = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          handleError(error.message);
          return;
        }

        if (data.session) {
          handleSuccess();
          return;
        }

        // بعض البيئات ترسل الرابط بصيغة ?code=... (PKCE)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            handleError(exchangeError.message);
            return;
          }

          // بعد التبادل، المفترض أن الجلسة أصبحت موجودة
          const { data: afterData } = await supabase.auth.getSession();
          if (afterData.session) {
            handleSuccess();
            return;
          }
        }

        // إذا ما زالت بدون جلسة بعد مهلة قصيرة
        setTimeout(() => {
          if (!isMounted) return;
          handleError('لم نتمكن من إنشاء جلسة من رابط الدخول. يرجى فتح أحدث رسالة والضغط على الرابط مرة أخرى.');
        }, 1500);
      } catch (err: any) {
        handleError(err?.message || 'حدث خطأ غير متوقع');
      }
    };

    run();

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
                <h1 className="text-xl font-bold mb-2">جاري التحقق...</h1>
                <p className="text-muted-foreground">يرجى الانتظار بينما نكمل تسجيل الدخول</p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold mb-2">تم تسجيل الدخول</h1>
                <p className="text-muted-foreground mb-4">تم توثيق بريدك وتسجيل الدخول بنجاح</p>
                <p className="text-sm text-muted-foreground">جاري التوجيه...</p>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-xl font-bold mb-2">تعذر تسجيل الدخول</h1>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/app/login')}>
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
