import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase يعالج الـ hash تلقائياً عند تحميل الصفحة
        // نحتاج فقط التحقق من الجلسة
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setErrorMessage(error.message);
          setState('error');
          return;
        }

        if (session) {
          // نجاح - المستخدم مسجل دخول
          setState('success');
          
          toast({
            title: 'تم تسجيل الدخول بنجاح!',
            description: 'مرحباً بك في وساطة'
          });

          // التوجيه بعد ثانية
          setTimeout(() => {
            navigate('/app/businesscard/edit', { replace: true });
          }, 1500);
        } else {
          // لا توجد جلسة - قد يكون الرابط منتهي الصلاحية
          setErrorMessage('انتهت صلاحية رابط الدخول أو أنه غير صالح');
          setState('error');
        }
      } catch (err: any) {
        console.error('Unexpected callback error:', err);
        setErrorMessage(err?.message || 'حدث خطأ غير متوقع');
        setState('error');
      }
    };

    // انتظار قليل لضمان معالجة الـ hash
    const timer = setTimeout(handleCallback, 500);
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
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
                <h2 className="text-xl font-bold mb-2">جاري التحقق...</h2>
                <p className="text-muted-foreground">
                  يرجى الانتظار بينما نتحقق من بياناتك
                </p>
              </div>
            )}

            {state === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">تم تسجيل الدخول بنجاح!</h2>
                <p className="text-muted-foreground mb-4">
                  تم توثيق بريدك وتسجيل الدخول بنجاح
                </p>
                <p className="text-sm text-muted-foreground">
                  جاري التوجيه...
                </p>
              </div>
            )}

            {state === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
                <p className="text-muted-foreground mb-4">
                  {errorMessage}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/login')}
                  >
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
