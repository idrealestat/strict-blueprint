/**
 * OfficialBusinessCardPage.tsx
 * صفحة البطاقة الرسمية للطباعة والتصدير
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Share2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OfficialBusinessCard from '@/components/business-card/OfficialBusinessCard';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

type OfficialBusinessCardPageProps = {
  /**
   * رجوع للواجهة السابقة داخل لوحة التحكم (sub-routing via App.tsx state).
   * إذا لم يتم تمريره، سنستخدم الانتقال إلى /app/dashboard كخيار احتياطي.
   */
  onBack?: () => void;
};

export default function OfficialBusinessCardPage({ onBack }: OfficialBusinessCardPageProps) {
  const navigate = useNavigate();
  const { flags, loading } = useFeatureFlags();

  /**
   * ⚠️ زر "رجوع" (مقفل/مهم):
   * هذا الزر يجب أن يُعيدك فعلياً إلى الواجهة الرئيسية داخل التطبيق.
   * ملاحظة مهمة: هذه الصفحة تُعرض داخل /app/dashboard عن طريق state داخلي (currentPage)
   * لذلك تغيير الـ URL وحده لا يكفي.
   * الرجاء عدم تعديل هذا السلوك إلا بعد الرجوع لصاحب المشروع.
   */
  const handleBackToDashboard = () => {
    if (onBack) return onBack();
    navigate('/app/dashboard');
  };

  // If feature is disabled, show message and redirect option
  if (!loading && !flags.official_business_card_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">الميزة غير متاحة</h2>
          <p className="text-gray-600 mb-6">
            تم إيقاف ميزة البطاقة الرسمية للطباعة. يرجى التواصل مع المسؤول لتفعيلها.
          </p>
          <Button
            onClick={() => navigate('/app/businesscard/profile')}
            className="bg-[#01411C] hover:bg-[#01411C]/90"
          >
            العودة للبطاقة الرقمية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white p-4 shadow-lg border-b-4 border-[#D4AF37]">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            رجوع
          </Button>
          
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="text-xl font-bold">بطاقة الأعمال الرسمية</h1>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate('/app/businesscard/profile')}
            className="text-white hover:bg-white/20"
          >
            <Share2 className="w-5 h-5 ml-2" />
            الرقمية
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {/* Description */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-[#D4AF37]/20">
          <h2 className="font-bold text-[#01411C] mb-2 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#D4AF37]" />
            البطاقة الرسمية للطباعة
          </h2>
          <p className="text-gray-600 text-sm">
            هذه البطاقة مصممة للطباعة الاحترافية. يمكنك تحميلها كصورة أو PDF أو طباعتها مباشرة.
            تحتوي على رمز QR يحتوي على بيانات vCard للمسح السريع.
          </p>
        </div>

        {/* Official Card Component */}
        <OfficialBusinessCard 
          onEdit={() => navigate('/app/businesscard/edit')}
        />

        {/* Tips */}
        <div className="mt-6 bg-[#01411C]/5 rounded-xl p-4 border border-[#01411C]/10">
          <h3 className="font-medium text-[#01411C] mb-2">نصائح للطباعة:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• استخدم ورق بطاقات الأعمال (350 جرام)</li>
            <li>• اختر الطباعة على الوجهين</li>
            <li>• حجم البطاقة القياسي: 90 × 55 مم</li>
            <li>• للحصول على أفضل جودة، حمّل PDF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
