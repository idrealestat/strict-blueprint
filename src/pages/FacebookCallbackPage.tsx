/**
 * FacebookCallbackPage.tsx
 * Handles Facebook OAuth callback
 */

import { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function FacebookCallbackPage() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    // Verify state matches
    const savedState = localStorage.getItem('facebook_oauth_state');
    
    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'facebook_oauth_callback',
          error: errorDescription || error
        }, window.location.origin);
      }
      return;
    }

    if (code && state === savedState) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'facebook_oauth_callback',
          code
        }, window.location.origin);
      }
    } else if (!window.opener) {
      // Not in popup, redirect to dashboard
      window.location.href = '/app/dashboard';
    }
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center p-8">
        {error ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-600 mb-2">فشل في تسجيل الدخول</h1>
            <p className="text-muted-foreground mb-4">{urlParams.get('error_description') || 'حدث خطأ أثناء المصادقة'}</p>
            <p className="text-sm text-muted-foreground">يمكنك إغلاق هذه النافذة</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold mb-2">جاري إكمال المصادقة...</h1>
            <p className="text-muted-foreground">يرجى الانتظار</p>
          </>
        )}
      </div>
    </div>
  );
}
