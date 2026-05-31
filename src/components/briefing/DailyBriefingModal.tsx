import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ExternalLink,
  Sunrise,
  Clock,
} from "lucide-react";
import type { BriefingSnapshot } from "@/hooks/useDailyBriefing";

interface Props {
  open: boolean;
  onClose: () => void;
  snapshot: BriefingSnapshot | null;
  loading?: boolean;
  onSnoozeOneHour?: () => void;
  onMarkRead?: (cardKey: string) => void;
}

export default function DailyBriefingModal({
  open,
  onClose,
  snapshot,
  loading,
  onSnoozeOneHour,
  onMarkRead,
}: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const cards = snapshot?.cards ?? [];
  const total = cards.length;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const today = useMemo(() => {
    const d = new Date();
    const gregorian = d.toLocaleDateString("ar-SA-u-ca-gregory", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    let hijri = "";
    try {
      hijri = d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {}
    return { gregorian, hijri };
  }, [open]);

  const current = cards[index];
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir="rtl"
        className="max-w-2xl w-[95vw] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col bg-background"
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-white"
          style={{
            background: "linear-gradient(135deg, #01411C 0%, #065f41 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.18)", border: "1.5px solid #D4AF37" }}
              >
                <Sunrise className="w-6 h-6" style={{ color: "#D4AF37" }} />
              </div>
              <div className="font-cairo">
                <h2 className="text-lg font-bold">صباح الخير 👋 موجز يومك</h2>
                <p className="text-xs opacity-90 mt-0.5">
                  {today.gregorian}
                  {today.hijri ? ` • ${today.hijri}` : ""}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/15 h-8 w-8 -mt-1"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5 opacity-90">
                <span>
                  بطاقة {index + 1} من {total}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-white/15" />
            </div>
          )}
        </div>

        {/* Critical alert bar */}
        {snapshot?.critical_alert && (
          <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 px-4 py-2.5 flex items-center gap-2 font-cairo">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold leading-snug">
              ⚠️ {snapshot.critical_alert.message}
            </p>
          </div>
        )}

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 font-cairo">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">جاري تجهيز الموجز...</div>
            ) : total === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">☕</div>
                <h3 className="text-lg font-bold mb-1">يوم هادئ!</h3>
                <p className="text-sm text-muted-foreground">
                  لا توجد مستجدات جديدة الآن. عُد لاحقاً لمتابعة جديدك.
                </p>
              </div>
            ) : current ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{current.emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold">{current.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {current.count} عنصر
                      </p>
                    </div>
                  </div>
                  {current.severity === "critical" && (
                    <Badge variant="destructive" className="font-cairo">
                      عاجل
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {current.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <p className="font-semibold text-sm">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                      )}
                      {item.meta && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.meta}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {current.count > current.items.length && (
                  <p className="text-xs text-muted-foreground text-center">
                    و {current.count - current.items.length} عنصر آخر...
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {current.viewAllPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-cairo"
                      onClick={() => {
                        navigate(current.viewAllPath!);
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      عرض الكل
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-cairo"
                    onClick={() => onMarkRead?.(current.key)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                    تم الاطلاع
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer navigation */}
        {total > 0 && (
          <div className="border-t px-4 py-3 flex items-center justify-between gap-2 bg-muted/30 font-cairo">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                السابق
              </Button>
              <Button
                size="sm"
                disabled={index >= total - 1}
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                style={{ background: "#01411C" }}
                className="text-white hover:opacity-90"
              >
                التالي
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
            <div className="flex gap-2">
              {onSnoozeOneHour && (
                <Button variant="ghost" size="sm" onClick={onSnoozeOneHour}>
                  <Clock className="w-3.5 h-3.5 ml-1.5" />
                  ذكّرني بعد ساعة
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                تخطّي
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}