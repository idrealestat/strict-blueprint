/**
 * إفصاح إلزامي لمخرجات الذكاء الاصطناعي
 * يُظهر للمستخدم أن المحتوى اقتراحي وليس ملزم
 * 
 * التوافق: المبدأ 1 - هوية المنصة ودورها النظامي
 */

import React from 'react';
import { AlertCircle, Info, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIOutputDisclaimerProps {
  type: 'price' | 'description' | 'recommendation' | 'analysis';
  variant?: 'inline' | 'banner' | 'tooltip';
  className?: string;
}

const DISCLAIMERS = {
  price: {
    title: 'سعر تقديري',
    message: 'السعر المقترح تقريبي ومبني على بيانات السوق. القرار النهائي يعود للمستخدم.',
    icon: Info,
  },
  description: {
    title: 'وصف مُولَّد',
    message: 'هذا الوصف مُولَّد بالذكاء الاصطناعي. يُرجى مراجعته والتأكد من دقته قبل النشر.',
    icon: Sparkles,
  },
  recommendation: {
    title: 'اقتراح فقط',
    message: 'هذه التوصيات استرشادية ولا تُعد استشارة عقارية ملزمة.',
    icon: AlertCircle,
  },
  analysis: {
    title: 'تحليل تقريبي',
    message: 'التحليل مبني على البيانات المتاحة وقد يختلف عن الواقع الفعلي.',
    icon: Info,
  },
};

export function AIOutputDisclaimer({ 
  type, 
  variant = 'inline',
  className = '' 
}: AIOutputDisclaimerProps) {
  const disclaimer = DISCLAIMERS[type];
  const Icon = disclaimer.icon;

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 ${className}`}
        dir="rtl"
      >
        <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-amber-800 dark:text-amber-300">
            {disclaimer.title}:
          </span>{' '}
          <span className="text-amber-700 dark:text-amber-400">
            {disclaimer.message}
          </span>
        </div>
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`w-full px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 border-y border-amber-200 dark:border-amber-800 ${className}`}
        dir="rtl"
      >
        <div className="flex items-center justify-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-300">
            {disclaimer.message}
          </span>
        </div>
      </div>
    );
  }

  // tooltip variant
  return (
    <div className={`relative inline-block ${className}`}>
      <Icon className="w-4 h-4 text-amber-500 cursor-help" />
      <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50">
        <strong>{disclaimer.title}:</strong> {disclaimer.message}
      </div>
    </div>
  );
}

/**
 * شارة تُظهر أن المحتوى مُولَّد بالذكاء الاصطناعي
 */
export function AIGeneratedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/50 dark:to-blue-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 ${className}`}
    >
      <Sparkles className="w-3 h-3" />
      <span>مُولَّد بالذكاء الاصطناعي</span>
    </span>
  );
}

/**
 * تذييل التطبيق مع بيان عدم المسؤولية
 */
export function PlatformDisclaimerFooter() {
  return (
    <div className="text-center text-xs text-muted-foreground py-4 px-4 border-t bg-muted/30" dir="rtl">
      <p>
        منصة <strong>وساطه AI</strong> هي منصة وساطة عقارية إلكترونية.
        لا تتخذ قرارات نيابة عن المستخدمين ولا تُعد طرفاً في أي عقد.
      </p>
      <p className="mt-1 text-muted-foreground/70">
        جميع المخرجات المولدة بالذكاء الاصطناعي اقتراحية وتخضع لمراجعة المستخدم.
      </p>
    </div>
  );
}

export default AIOutputDisclaimer;
