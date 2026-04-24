import { useNavigate } from "react-router-dom";
import { ArrowRight, X, Info, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ComprehensiveAppSettings from "@/components/settings/ComprehensiveAppSettings";
import { useHelpHints } from "@/context/HelpHintsContext";

/**
 * AppSettingsPage
 * صفحة كاملة لـ "إعدادات التطبيق الشامل".
 * تحتوي على:
 *  - شريط علوي ثابت فيه زر إغلاق/رجوع واضح.
 *  - مفتاح سريع لتشغيل/إيقاف "العلامات الدليلية" (i الزرقاء).
 *  - محتوى الإعدادات الكامل أسفل الشريط.
 */
export default function AppSettingsPage() {
  const navigate = useNavigate();
  const helpHints = useHelpHints();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/app/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* شريط علوي ثابت — يحوي زر الإغلاق ومفتاح العلامات الدليلية */}
      <header className="sticky top-0 z-[60] bg-gradient-to-r from-[#01411C] to-[#065f41] text-white shadow-lg">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* يمين: العنوان */}
          <div className="flex items-center gap-3 min-w-0">
            <SettingsIcon className="w-6 h-6 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold truncate">
                إعدادات التطبيق الشامل
              </h1>
              <p className="text-xs text-white/70 truncate hidden sm:block">
                مركز التحكم الموحد لجميع الميزات
              </p>
            </div>
          </div>

          {/* يسار: مفتاح العلامات الدليلية + زر الإغلاق */}
          <div className="flex items-center gap-2 shrink-0">
            {/* مفتاح سريع للعلامات الدليلية */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <Info className="w-4 h-4 text-blue-200" />
              <Label
                htmlFor="help-hints-toggle"
                className="text-xs text-white cursor-pointer whitespace-nowrap"
              >
                العلامات الدليلية
              </Label>
              <Switch
                id="help-hints-toggle"
                checked={helpHints.isEnabled}
                onCheckedChange={(v) => (v ? helpHints.enable() : helpHints.disable())}
              />
            </div>

            {/* زر رجوع */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">رجوع</span>
            </Button>

            {/* زر إغلاق (X) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="إغلاق الإعدادات"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* مفتاح العلامات الدليلية — نسخة الجوال */}
        <div className="md:hidden flex items-center justify-between gap-2 bg-black/20 px-4 py-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-200" />
            <Label
              htmlFor="help-hints-toggle-mobile"
              className="text-xs text-white cursor-pointer"
            >
              العلامات الدليلية (دائرة i الزرقاء)
            </Label>
          </div>
          <Switch
            id="help-hints-toggle-mobile"
            checked={helpHints.isEnabled}
            onCheckedChange={(v) => (v ? helpHints.enable() : helpHints.disable())}
          />
        </div>
      </header>

      {/* محتوى الإعدادات */}
      <main className="flex-1 relative min-h-0 overflow-hidden">
        <ComprehensiveAppSettings variant="page" />
      </main>
    </div>
  );
}