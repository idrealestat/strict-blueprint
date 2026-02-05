import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TikTokCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري معالجة التفويض...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'حدث خطأ أثناء التفويض');
      return;
    }

    if (code) {
      // Store the authorization code temporarily
      localStorage.setItem('tiktok_auth_code', code);
      setStatus('success');
      setMessage('تم التفويض بنجاح! جاري إعادة التوجيه...');
      
      // Redirect to social media publishing after short delay
      setTimeout(() => {
        navigate('/app/dashboard', { 
          state: { tiktokConnected: true, authCode: code } 
        });
      }, 2000);
    } else {
      setStatus('error');
      setMessage('لم يتم استلام رمز التفويض');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
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
