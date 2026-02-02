/**
 * CallLogsLinkingBanner.tsx
 * Banner لتفعيل ربط الاتصالات الأخيرة بالعملاء
 * 
 * ✅ متوافق مع سياسات Google Play و Apple App Store:
 * - يظهر فقط عندما لم يتم تفعيل الربط
 * - يشرح بوضوح ما سيتم الوصول إليه
 * - يتطلب إجراء صريح من المستخدم
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Phone, 
  Link2, 
  Shield, 
  AlertCircle,
  X,
  Smartphone,
  Apple,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallLogsLinkingBannerProps {
  isIOS: boolean;
  isLinkingEnabled: boolean;
  isLoading: boolean;
  onEnableLinking: () => void;
  onDismiss?: () => void;
}

export default function CallLogsLinkingBanner({
  isIOS,
  isLinkingEnabled,
  isLoading,
  onEnableLinking,
  onDismiss,
}: CallLogsLinkingBannerProps) {
  // لا نعرض البانر إذا تم تفعيل الربط
  if (isLinkingEnabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* أيقونة */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              
              {/* المحتوى */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    ربط الاتصالات الأخيرة
                  </h3>
                  {isIOS && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                      <Apple className="w-3 h-3" />
                      محدود
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {isIOS ? (
                    <>
                      اربط جهات الاتصال بعملائك. 
                      <span className="text-amber-600 font-medium"> نظام iOS لا يسمح بعرض سجل المكالمات.</span>
                    </>
                  ) : (
                    'اعرض الاتصالات الأخيرة كبطاقات عملاء واربطها تلقائياً بملفات العملاء الموجودين.'
                  )}
                </p>
                
                {/* معلومات الخصوصية */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs">
                    <Shield className="w-3 h-3" />
                    معالجة محلية فقط
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                    <Lock className="w-3 h-3" />
                    لا إرسال للسيرفر
                  </span>
                </div>
                
                {/* الأزرار */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onEnableLinking}
                    disabled={isLoading}
                    size="sm"
                    className="gap-2"
                  >
                    {isLoading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {isIOS ? 'ربط جهات الاتصال' : 'تفعيل الربط'}
                  </Button>
                  
                  {onDismiss && (
                    <Button
                      onClick={onDismiss}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      لاحقاً
                    </Button>
                  )}
                </div>
              </div>
              
              {/* زر الإغلاق */}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
