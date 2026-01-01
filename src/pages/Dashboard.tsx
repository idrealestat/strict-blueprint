import MainLayout from "@/components/layout/MainLayout";
import NewsBar from "@/components/NewsBar";
import MainServices from "@/components/MainServices";
import QuickCalculator from "@/components/QuickCalculator";
import CalendarTabs from "@/components/CalendarTabs";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 1. شريط الأخبار العاجلة - 8 أخبار */}
        <NewsBar />

        {/* 3. الواجهة الرئيسية - 8 خدمات */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">الخدمات الرئيسية</h2>
          <MainServices />
        </div>

        {/* 4 & 5. التقويم والحاسبة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* التقويم - 9 تبويبات */}
          <div className="lg:col-span-2">
            <CalendarTabs />
          </div>
          
          {/* الحاسبة السريعة */}
          <div>
            <QuickCalculator />
          </div>
        </div>

        {/* 6. التحليلات */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">التحليلات والتقارير</h2>
          <AnalyticsDashboard />
        </div>

        {/* المساعد الذكي يظهر كزر عائم من App.tsx */}
      </div>
    </MainLayout>
  );
};

export default Dashboard;