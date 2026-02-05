import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTikTokAuth } from "@/hooks/useTikTokAuth";

const TikTokCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useTikTokAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري معالجة التفويض...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'حدث خطأ أثناء التفويض');
        return;
      }

      if (code && state) {
        try {
          const success = await handleCallback(code, state);
          if (success) {
            setStatus('success');
            setMessage('تم التفويض بنجاح! جاري إعادة التوجيه...');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
              navigate('/app/dashboard', { 
                state: { tiktokConnected: true } 
              });
            }, 2000);
          } else {
            setStatus('error');
            setMessage('فشل في إتمام التفويض');
          }
        } catch (err) {
          setStatus('error');
          setMessage('حدث خطأ أثناء معالجة التفويض');
        }
      } else {
        setStatus('error');
        setMessage('معلومات التفويض غير مكتملة');
      }
    };

    processCallback();
  }, [searchParams, navigate, handleCallback]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {/* TikTok Logo */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#25F4EE] via-[#FE2C55] to-black flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
              <p className="text-lg font-medium text-emerald-600">{message}</p>
              <p className="text-sm text-muted-foreground">
                سيتم إعادة توجيهك تلقائياً...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <Button 
                onClick={() => navigate('/app/dashboard')}
                className="mt-4"
              >
                العودة للوحة التحكم
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokCallbackPage;
