import MainLayout from "@/components/layout/MainLayout";
import NewsBar from "@/components/NewsBar";
import MainServices from "@/components/MainServices";
import QuickCalculator from "@/components/QuickCalculator";
import CalendarTabs from "@/components/CalendarTabs";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import { useAcademy } from "@/contexts/AcademyContext";
import { Shield } from "lucide-react";

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

        {/* 1. شريط الأخبار العاجلة - 8 أخبار */}
        <NewsBar />

        {/* 3. الواجهة الرئيسية - 8 خدمات */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">الخدمات الرئيسية</h2>
          <MainServices />
        </div>

        {/* التقويم الرئيسي - مرتبط بقاعدة البيانات */}
        <CalendarTabs />

        {/* الحاسبة السريعة */}
        <QuickCalculator />

        {/* 6. التحليلات */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">التحليلات والتقارير</h2>
          <AnalyticsDashboard />
        </div>

        {/* المساعد الذكي يظهر كزر عائم من App.tsx */}
      </div>
    </MainLayout>
  );
};

export default Dashboard;