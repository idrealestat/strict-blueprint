/**
 * HelpHint
 * دائرة زرقاء صغيرة بداخلها حرف i (information).
 * عند التحويم (ديسكتوب) أو اللمس (جوال) تظهر رسالة سحابية تشرح وظيفة الزر/الحقل.
 *
 * الاستخدام:
 *   <HelpHint title="حفظ" description="يحفظ التعديلات في حسابك" />
 *
 * تظهر الأيقونة فقط إذا كانت العلامات الدليلية مفعّلة (HelpHintsContext).
 */

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useHelpHints } from '@/context/HelpHintsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface HelpHintProps {
  /** عنوان قصير (اسم الزر) */
  title: string;
  /** وصف سطر واحد لوظيفة الزر */
  description: string;
  /** الحجم */
  size?: 'xs' | 'sm' | 'md';
  /** كلاس إضافي للحاوية */
  className?: string;
  /** جانب ظهور الفقاعة */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const SIZE_MAP = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
} as const;

const ICON_SIZE_MAP = {
  xs: 10,
  sm: 12,
  md: 14,
} as const;

export function HelpHint({
  title,
  description,
  size = 'sm',
  className,
  side = 'top',
}: HelpHintProps) {
  const { isEnabled } = useHelpHints();
  const isMobile = useIsMobile();

  if (!isEnabled) return null;

  const trigger = (
    <span
      role="button"
      tabIndex={0}
      aria-label={`مساعدة: ${title}`}
      onClick={(e) => {
        // منع تنشيط الزر الأصلي عند الضغط على علامة المساعدة
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-blue-500 text-white shadow-sm',
        'ring-1 ring-blue-400/50 hover:ring-2 hover:ring-blue-300',
        'cursor-help align-middle shrink-0',
        'transition-all duration-150',
        SIZE_MAP[size],
        className
      )}
    >
      <Info size={ICON_SIZE_MAP[size]} strokeWidth={2.5} />
    </span>
  );

  const content = (
    <div className="text-right" dir="rtl">
      <div className="font-bold text-amber-300 mb-1">{title}</div>
      <div className="text-xs text-white/95 leading-relaxed">{description}</div>
    </div>
  );

  // الجوال: Popover بالنقر
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side={side}
          align="center"
          className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white border-2 border-amber-500 max-w-[260px] p-3 z-[100]"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // الديسكتوب: Tooltip بالتحويم
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white border-2 border-amber-500 max-w-[260px] p-3 z-[100]"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HelpHint;