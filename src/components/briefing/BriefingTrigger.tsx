import { Button } from "@/components/ui/button";
import { Sunrise } from "lucide-react";
import { useBriefingSettings } from "@/hooks/useBriefingSettings";
import { openBriefingManually } from "@/hooks/useDailyBriefing";
import { HelpHint } from "@/components/ui/help-hint";

/**
 * زر "موجز فوري" في الهيدر. يظهر فقط إذا فعّله المستخدم.
 */
export default function BriefingTrigger() {
  const { settings } = useBriefingSettings();
  if (!settings || !settings.show_instant_button || !settings.enabled) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => openBriefingManually()}
        className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white h-9 w-9"
        aria-label="موجز فوري"
      >
        <Sunrise className="w-5 h-5" />
      </Button>
      <div className="absolute -bottom-1 -right-1">
        <HelpHint
          size="xs"
          side="bottom"
          title="موجز فوري"
          description="عرض موجز اليوم الكامل: مهام، مواعيد، فرص ذكية، وتنبيهات حرجة في نافذة واحدة."
          source="Internal: src/components/briefing/DailyBriefingModal.tsx"
        />
      </div>
    </div>
  );
}