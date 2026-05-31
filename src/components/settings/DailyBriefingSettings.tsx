import { useBriefingSettings, type BriefingEnabledCards } from "@/hooks/useBriefingSettings";
import { openBriefingManually } from "@/hooks/useDailyBriefing";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sunrise, Sparkles } from "lucide-react";

const CARD_LABELS: Array<{ key: keyof BriefingEnabledCards; label: string }> = [
  { key: "tasks", label: "مهام اليوم والمتأخرة" },
  { key: "appointments", label: "مواعيد اليوم" },
  { key: "new_customers", label: "عملاء جدد آخر 3 أيام" },
  { key: "offers_requests", label: "عروض وطلبات جديدة" },
  { key: "smart_opportunities", label: "فرص ذكية مطابقة" },
  { key: "vip_requests", label: "طلبات VIP" },
  { key: "market_analytics", label: "تحليلات السوق" },
  { key: "team_updates", label: "مستجدات الفريق" },
  { key: "critical_alerts", label: "تنبيهات حرجة" },
  { key: "yesterday_performance", label: "ملخص أداء أمس" },
  { key: "smart_recommendation", label: "توصية ذكية" },
  { key: "potential_opportunity", label: "فرصة محتملة" },
];

const DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function DailyBriefingSettings() {
  const { settings, loading, update } = useBriefingSettings();

  if (loading || !settings) {
    return <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>;
  }

  const toggleCard = (key: keyof BriefingEnabledCards, value: boolean) => {
    update({ enabled_cards: { ...settings.enabled_cards, [key]: value } });
  };

  const toggleDay = (day: number, on: boolean) => {
    const set = new Set(settings.active_days);
    if (on) set.add(day);
    else set.delete(day);
    update({ active_days: Array.from(set).sort() });
  };

  return (
    <div className="space-y-5 font-cairo">
      {/* رأس تعريفي */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ background: "linear-gradient(135deg, #01411C 0%, #065f41 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.18)", border: "1.5px solid #D4AF37" }}
          >
            <Sunrise className="w-5 h-5" style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <h3 className="font-bold">الموجز الصباحي</h3>
            <p className="text-xs opacity-90 mt-0.5">
              نافذة منبثقة كل صباح تجمع كل ما يهمك في مكان واحد.
            </p>
          </div>
        </div>
      </div>

      {/* المفاتيح الرئيسية */}
      <div className="space-y-2">
        <Row label="تفعيل الموجز الصباحي" description="إيقاف يخفي النافذة التلقائية والزر">
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
          />
        </Row>

        <Row label="إظهار زر «موجز فوري» في الهيدر" description="أيقونة بجوار جرس الإشعارات">
          <Switch
            checked={settings.show_instant_button}
            onCheckedChange={(v) => update({ show_instant_button: v })}
          />
        </Row>

        <Row label="وقت الظهور اليومي" description="بتوقيت الرياض">
          <Input
            type="time"
            value={settings.briefing_time.slice(0, 5)}
            onChange={(e) => update({ briefing_time: `${e.target.value}:00` })}
            className="w-28 text-center"
          />
        </Row>

        <Row
          label="الموجز التراكمي بعد الغياب"
          description="عند العودة بعد عدد أيام محدد يظهر ملخص ما فاتك"
        >
          <Switch
            checked={settings.enable_cumulative}
            onCheckedChange={(v) => update({ enable_cumulative: v })}
          />
        </Row>

        {settings.enable_cumulative && (
          <Row label="عدد أيام الغياب لتفعيل الموجز التراكمي">
            <Input
              type="number"
              min={1}
              max={14}
              value={settings.cumulative_after_days}
              onChange={(e) =>
                update({ cumulative_after_days: Math.max(1, parseInt(e.target.value || "3", 10)) })
              }
              className="w-20 text-center"
            />
          </Row>
        )}

        <Row label="إرسال نسخة كإشعار Push">
          <Switch
            checked={settings.send_push}
            onCheckedChange={(v) => update({ send_push: v })}
          />
        </Row>

        <Row label="إرسال نسخة عبر واتساب" description="عبر Wasender">
          <Switch
            checked={settings.send_whatsapp}
            onCheckedChange={(v) => update({ send_whatsapp: v })}
          />
        </Row>
      </div>

      {/* أيام التفعيل */}
      <div>
        <Label className="font-bold text-sm mb-2 block">أيام التفعيل</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => {
            const checked = settings.active_days.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i, !checked)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  checked
                    ? "text-white border-transparent"
                    : "bg-card border-border text-muted-foreground hover:bg-accent"
                }`}
                style={checked ? { background: "#01411C" } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* البطاقات المفعّلة */}
      <div>
        <Label className="font-bold text-sm mb-2 block flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#D4AF37" }} />
          البطاقات المفعّلة
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CARD_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 p-2.5 rounded-lg border bg-card cursor-pointer hover:bg-accent/40"
            >
              <Checkbox
                checked={settings.enabled_cards[key]}
                onCheckedChange={(v) => toggleCard(key, !!v)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* زر تجربة */}
      <div className="pt-2">
        <Button
          onClick={() => openBriefingManually()}
          className="w-full text-white"
          style={{ background: "#01411C" }}
        >
          <Sunrise className="w-4 h-4 ml-2" />
          اعرض موجز اليوم الآن
        </Button>
      </div>
    </div>
  );
}