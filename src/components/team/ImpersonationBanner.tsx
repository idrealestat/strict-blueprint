/**
 * ImpersonationBanner.tsx
 * بنر علوي أحمر يظهر عند انتحال هوية عضو فريق (وضع المراقبة - قراءة فقط)
 */
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpersonate } from '@/hooks/useImpersonate';

export default function ImpersonationBanner() {
  const { impersonation, isImpersonating, stop } = useImpersonate();

  if (!isImpersonating || !impersonation) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-red-600 text-white shadow-lg" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="font-bold truncate">
            وضع المراقبة: تشاهد بيانات "{impersonation.memberName}" (قراءة فقط)
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={stop}
          className="text-white hover:bg-white/20 h-7 px-3"
        >
          <X className="w-4 h-4 ml-1" />
          إنهاء المراقبة
        </Button>
      </div>
    </div>
  );
}
