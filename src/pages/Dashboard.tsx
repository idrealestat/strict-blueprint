import MainLayout from "@/components/layout/MainLayout";
import RegulatoryBar from "@/components/RegulatoryBar";
import BankRatesBar from "@/components/BankRatesBar";
import MainServices from "@/components/MainServices";
import QuickCalculator from "@/components/QuickCalculator";
import CalendarTabs from "@/components/CalendarTabs";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import { useAcademy } from "@/contexts/AcademyContext";
import { Shield } from "lucide-react";
import { HelpHint } from "@/components/ui/help-hint";

const Dashboard = () => {
  // تفعيل نظام التذكير بالمواعيد
  useAppointmentReminders();
  const { status, loading: academyLoading } = useAcademy();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* شارة الوسيط المحترف */}
        {!academyLoading && status?.professional_badge && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-bold text-green-800 dark:text-green-300">وسيط محترف معتمد 🛡️</h3>
              <p className="text-green-700 dark:text-green-400 text-sm">
                لديك {status.daily_opportunities} فرصة ذكية يومياً (بدلاً من 5)
              </p>
            </div>
          </div>
        )}

        {/* شريط التحديثات التنظيمية الرسمية (REGA / SAMA / إيجار ...) */}
        <RegulatoryBar />

        {/* شريط المؤشرات البنكية الحيّة (سايبور / ريبو / رهن) */}
        <BankRatesBar />

        {/* 3. الواجهة الرئيسية - 8 خدمات */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span>الخدمات الرئيسية</span>
            <HelpHint
              title="الخدمات الرئيسية"
              description="ثمانية أزرار للوصول السريع لأهم خدمات التطبيق: الفرص الذكية، إدارة العملاء، التقارير، العقود، النشر الاجتماعي، الإعدادات والدعم."
            />
          </h2>
          <MainServices />
        </div>

        {/* التقويم الرئيسي - مرتبط بقاعدة البيانات */}
        <CalendarTabs />

        {/* الحاسبة السريعة */}
        <QuickCalculator />

        {/* 6. التحليلات */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span>التحليلات والتقارير</span>
            <HelpHint
              title="التحليلات والتقارير"
              description="رسوم بيانية ومؤشرات تُظهر أداء عقاراتك ومشاهداتك ومعدلات التواصل خلال الفترة المختارة."
            />
          </h2>
          <AnalyticsDashboard />
        </div>

        {/* المساعد الذكي يظهر كزر عائم من App.tsx */}
      </div>
    </MainLayout>
  );
};

export default Dashboard;