import { useNavigate } from "react-router-dom";
import ComprehensiveAppSettings from "@/components/settings/ComprehensiveAppSettings";

/**
 * AppSettingsPage
 * صفحة كاملة لـ "إعدادات التطبيق الشامل" بدلاً من النافذة المنبثقة.
 * تعيد استخدام نفس المكوّن مع تثبيت isOpen=true، وعند الإغلاق ترجع للخلف.
 */
export default function AppSettingsPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/app/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ComprehensiveAppSettings isOpen={true} onClose={handleClose} />
    </div>
  );
}