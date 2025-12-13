/**
 * RealEstateNewsTicker.tsx
 * شريط أخبار عقارية متحرك
 */

import { Newspaper } from "lucide-react";

const NEWS_ITEMS = [
  "📈 ارتفاع أسعار العقارات في الرياض بنسبة 5% خلال الربع الأخير",
  "🏗️ إطلاق مشروع سكني جديد في جدة يضم 2000 وحدة",
  "📊 تقرير: زيادة الطلب على الفلل بنسبة 15%",
  "🌟 برنامج سكني يعلن عن دفعة جديدة من المستفيدين",
  "💰 البنوك تخفض فوائد التمويل العقاري",
  "🏠 ارتفاع معدل الإيجارات في المنطقة الشرقية",
];

export default function RealEstateNewsTicker() {
  return (
    <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] text-white py-2 px-4 rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0 bg-white/10 px-3 py-1 rounded-full">
          <Newspaper className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-bold text-[#D4AF37]">أخبار عقارية</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...NEWS_ITEMS, ...NEWS_ITEMS].map((news, index) => (
              <span key={index} className="mx-8 text-sm">
                {news}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
