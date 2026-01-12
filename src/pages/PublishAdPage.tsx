/**
 * PublishAdPage.tsx
 * صفحة نشر إعلان جديد - صفحة كاملة
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyPublishForm from "@/components/platform/PropertyPublishForm";
import { toast } from "sonner";

const PublishAdPage = () => {
  const navigate = useNavigate();

  const handlePublish = (data: any) => {
    toast.success('تم نشر الإعلان بنجاح');
    navigate('/app/dashboard');
  };

  const handleCancel = () => {
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-l from-[#01411C] to-[#065f41] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="text-white hover:bg-white/20"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  نشر إعلان جديد
                </h1>
                <p className="text-xs text-white/80">أضف إعلانك العقاري الآن</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <PropertyPublishForm
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default PublishAdPage;
