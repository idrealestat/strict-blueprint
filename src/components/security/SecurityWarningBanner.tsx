/**
 * SecurityWarningBanner.tsx
 * Shows security warning on shared/public devices
 * Reminds users to log out when done
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';

interface SecurityWarningBannerProps {
  onLogout?: () => void;
}

export function SecurityWarningBanner({ onLogout }: SecurityWarningBannerProps) {
  const { user } = useAuthContext();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has already dismissed the warning this session
    const dismissedKey = `security_warning_dismissed_${user.id}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey);
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Detect if likely a shared/public device
    const isLikelySharedDevice = detectSharedDevice();
    
    // Always show on first login of session, or if shared device detected
    const sessionLoginKey = `session_login_shown_${user.id}`;
    const hasShownThisSession = sessionStorage.getItem(sessionLoginKey);
    
    if (!hasShownThisSession || isLikelySharedDevice) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
        sessionStorage.setItem(sessionLoginKey, 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const detectSharedDevice = (): boolean => {
    // Simple heuristics to detect shared devices
    try {
      // Check if in incognito/private mode (limited storage)
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      
      // Check if multiple users have logged in on this device
      const loginHistory = localStorage.getItem('login_history');
      if (loginHistory) {
        const history = JSON.parse(loginHistory);
        if (Array.isArray(history) && history.length > 1) {
          return true;
        }
      }
      
      // Check if device memory is limited (common in shared terminals)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory && memory < 2) {
          return true;
        }
      }
      
      return false;
    } catch {
      // If storage test fails, likely incognito/restricted
      return true;
    }
  };

  const handleDismiss = () => {
    if (user) {
      sessionStorage.setItem(`security_warning_dismissed_${user.id}`, 'true');
    }
    setDismissed(true);
    
    // Auto hide after dismissal
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Track login history for multi-user detection
  useEffect(() => {
    if (!user) return;
    
    try {
      const loginHistory = JSON.parse(localStorage.getItem('login_history') || '[]');
      if (!loginHistory.includes(user.id)) {
        loginHistory.push(user.id);
        // Keep only last 5
        if (loginHistory.length > 5) {
          loginHistory.shift();
        }
        localStorage.setItem('login_history', JSON.stringify(loginHistory));
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  if (!showBanner || dismissed || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 p-2"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-bold text-sm">تنبيه أمني</h3>
              </div>
              
              <p className="text-sm text-white/90 leading-relaxed">
                إذا كنت تستخدم جهازاً مشتركاً أو عاماً، تأكد من تسجيل الخروج عند الانتهاء لحماية بياناتك.
                يتم مسح جميع البيانات الحساسة تلقائياً عند تسجيل الخروج.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <LogOut className="w-3 h-3 ml-1" />
                  تسجيل الخروج الآن
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  فهمت، استمر
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SecurityWarningBanner;
