/**
 * NewsBar.tsx
 * شريط الأخبار العاجلة - 8 أخبار حرفية
 */

import { useState, useEffect } from 'react';

interface NewsItem {
  id: number;
  title: string;
  time: string;
  category: string;
  trending: boolean;
}

const NewsBar = () => {
  const news: NewsItem[] = [
    {
      id: 1,
      title: 'ارتفاع مؤشر السوق المالي بنسبة 3.2%',
      time: 'منذ 5 دقائق',
      category: 'مالي',
      trending: true
    },
    {
      id: 2,
      title: 'توقيع اتفاقية تعاون استراتيجي مع شركة عالمية',
      time: 'منذ 15 دقيقة',
      category: 'أعمال',
      trending: false
    },
    {
      id: 3,
      title: 'إطلاق منتج جديد يدعم تقنية الذكاء الاصطناعي',
      time: 'منذ ساعة',
      category: 'تكنولوجيا',
      trending: true
    },
    {
      id: 4,
      title: 'ورشة عمل عن إدارة المحافظ الاستثمارية',
      time: 'منذ ساعتين',
      category: 'تعليمي',
      trending: false
    },
    {
      id: 5,
      title: 'تقرير الربع الأول يحقق نمواً غير مسبوق',
      time: 'منذ 3 ساعات',
      category: 'مالي',
      trending: true
    },
    {
      id: 6,
      title: 'توسعة الفروع في 5 دول جديدة',
      time: 'منذ 4 ساعات',
      category: 'أخبار',
      trending: false
    },
    {
      id: 7,
      title: 'ندوة عن مستقبل العملات الرقمية',
      time: 'منذ 5 ساعات',
      category: 'اقتصاد',
      trending: true
    },
    {
      id: 8,
      title: 'فريقنا يفوز بجائزة التميز في الخدمة',
      time: 'منذ 6 ساعات',
      category: 'أخبار',
      trending: false
    }
  ];

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded"></div>
          <h3 className="font-bold text-lg">الأخبار العاجلة</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">تحديث تلقائي كل 5 دقائق</span>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="overflow-hidden h-8">
        <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {news.map((item) => (
            <span key={item.id} className="inline-block mx-6">
              <span className={`px-3 py-1 rounded-full text-xs ${item.trending ? 'bg-red-900/50 text-red-200' : 'bg-gray-700 text-gray-300'}`}>
                {item.category}
              </span>
              <span className="mx-3">{item.title}</span>
              <span className="text-gray-400 text-sm">• {item.time}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsBar;
