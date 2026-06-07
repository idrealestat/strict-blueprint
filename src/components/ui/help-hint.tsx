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
  /**
   * المرجع/المصدر الداخلي لمحتوى التلميح.
   * مطلوب توثيقاً (لكن اختياري في النوع لتفادي كسر مواقع الاستدعاء القديمة).
   * استخدم 'TODO: <ملاحظة>' عند عدم توفر مصدر بعد. يُعرض في وضع التطوير
   * داخل الفقاعة، ويُحفظ دائماً في DOM عبر السمة data-help-source للتدقيق.
   * إذا لم يُمرَّر، يُعتبر 'TODO: no-source' ويُسجَّل تحذير في الكونسول (DEV).
   */
  source?: string;
}

const SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-7 h-7',
} as const;

const ICON_SIZE_MAP = {
  xs: 13,
  sm: 15,
  md: 17,
} as const;

export function HelpHint({
  title,
  description,
  size = 'sm',
  className,
  side = 'top',
  source,
}: HelpHintProps) {
  const { isEnabled } = useHelpHints();
  const isMobile = useIsMobile();

  if (!isEnabled) return null;

  // تحذير في وضع التطوير عند غياب المصدر — لا يمنع التشغيل
  if (import.meta.env.DEV && (!source || !source.trim())) {
    console.warn(
      `[HelpHint] Missing 'source' for hint "${title}". Use 'TODO: ...' if no source is available yet.`
    );
  }

  const trigger = (
    <span
      role="button"
      tabIndex={0}
      aria-label={`مساعدة: ${title}`}
      data-help-source={source || 'TODO: no-source'}
      className={cn(
        'absolute -top-1.5 -left-1.5 z-50',
        'inline-flex items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
        'ring-2 ring-primary/30 hover:ring-4 hover:ring-primary/25',
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
      <div className="font-bold text-primary mb-1">{title}</div>
      <div className="text-xs text-popover-foreground leading-relaxed">{description}</div>
      {import.meta.env.DEV && (
        <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
          <span className="font-semibold">المصدر:</span> {source || 'TODO: no-source'}
        </div>
      )}
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
          className="bg-popover text-popover-foreground border-2 border-primary max-w-[260px] p-3 z-[100] shadow-lg"
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
          className="bg-popover text-popover-foreground border-2 border-primary max-w-[260px] p-3 z-[100] shadow-lg"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HelpHint;