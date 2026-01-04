import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type CallbackState = 'loading' | 'success' | 'expired' | 'no_session';

function hasOtpExpired(): boolean {
  const full = `${window.location.search}${window.location.hash}`;
  return full.includes('error_code=otp_expired');
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('loading');

  const otpExpired = useMemo(() => hasOtpExpired(), []);

  useEffect(() => {
    let mounted = true;

    if (otpExpired) {
      setState('expired');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        navigate('/app/businesscard/edit', { replace: true });
      }

      // إذا خرج المستخدم من الجلسة وهو داخل callback، نعرض خيار الرجوع لتسجيل الدخول
      if (event === 'SIGNED_OUT' && !session) {
        setState('no_session');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session) {
        setState('success');
        navigate('/app/businesscard/edit', { replace: true });
      } else {
        setState('no_session');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, otpExpired]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
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
                <h1 className="text-xl font-bold mb-2">جاري التحقق من الجلسة...</h1>
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

            {state === 'expired' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h1 className="text-xl font-bold mb-2">انتهت صلاحية الرابط</h1>
                <p className="text-muted-foreground mb-4">انتهت صلاحية الرابط. أعد إرسال رابط الدخول.</p>
                <Button onClick={() => navigate('/app/login', { replace: true })}>إعادة إرسال الرابط</Button>
              </div>
            )}

            {state === 'no_session' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h1 className="text-xl font-bold mb-2">لم يتم العثور على جلسة</h1>
                <p className="text-muted-foreground mb-4">إذا فتحت الرابط الآن وتوقفت هنا، جرّب إعادة فتح رابط الدخول من بريدك.</p>
                <Button variant="outline" onClick={() => navigate('/app/login', { replace: true })}>
                  العودة لتسجيل الدخول
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
