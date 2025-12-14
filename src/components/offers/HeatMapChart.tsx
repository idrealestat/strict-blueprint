import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

export default function HeatMapChart() {
  const [timeRange, setTimeRange] = useState('week');
  
  // بيانات خريطة الحرارة
  const heatmapData = [
    { city: 'الرياض', views: 4520, clicks: 892, conversions: 145, trend: '+12.5%', rank: 1 },
    { city: 'جدة', views: 3840, clicks: 756, conversions: 128, trend: '+8.3%', rank: 2 },
    { city: 'الدمام', views: 2890, clicks: 543, conversions: 98, trend: '+5.7%', rank: 3 },
    { city: 'مكة', views: 2340, clicks: 421, conversions: 76, trend: '+3.2%', rank: 4 },
    { city: 'المدينة', views: 1980, clicks: 387, conversions: 64, trend: '+2.1%', rank: 5 },
    { city: 'الخبر', views: 1560, clicks: 298, conversions: 52, trend: '-1.2%', rank: 6 },
    { city: 'تبوك', views: 1240, clicks: 234, conversions: 38, trend: '+1.8%', rank: 7 },
    { city: 'أبها', views: 980, clicks: 187, conversions: 29, trend: '+0.9%', rank: 8 }
  ];
  
  const maxViews = Math.max(...heatmapData.map(d => d.views));
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[#D4AF37]'; // ذهبي
    if (rank === 2) return 'text-gray-400'; // فضي
    if (rank === 3) return 'text-[#CD7F32]'; // برونزي
    return 'text-gray-600';
  };
  
  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 mb-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-[#D4AF37]" />
            خريطة الحرارة - أداء المدن
          </h2>
          <p className="text-gray-600 text-sm mt-1">تحليل شامل لأداء العروض حسب المناطق</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'أسبوع' },
            { id: 'month', label: 'شهر' },
            { id: 'all', label: 'الكل' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === range.id
                  ? 'bg-[#01411C] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">إجمالي المشاهدات</div>
          <div className="text-3xl font-bold text-blue-900">19,350</div>
          <div className="text-xs text-green-600 font-medium mt-1">↗ +8.7%</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="text-sm text-gray-600 mb-1">إجمالي النقرات</div>
          <div className="text-3xl font-bold text-green-900">3,718</div>
          <div className="text-xs text-green-600 font-medium mt-1">↗ +6.2%</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="text-sm text-gray-600 mb-1">التحويلات</div>
          <div className="text-3xl font-bold text-purple-900">630</div>
          <div className="text-xs text-green-600 font-medium mt-1">↗ +4.9%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
          <div className="text-sm text-gray-600 mb-1">معدل التحويل</div>
          <div className="text-3xl font-bold text-amber-900">16.9%</div>
          <div className="text-xs text-red-600 font-medium mt-1">↘ -0.3%</div>
        </div>
      </div>
      
      {/* Heat Map */}
      <div className="space-y-3">
        {heatmapData.map((city, index) => {
          const intensity = (city.views / maxViews) * 100;
          const isPositiveTrend = city.trend.startsWith('+');
          
          return (
            <div key={index} className="group">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-2xl font-bold ${getRankColor(city.rank)} w-12 text-center`}>
                  {getRankBadge(city.rank)}
                </span>
                <span className="font-bold text-gray-800 w-24">{city.city}</span>
                
                {/* Progress Bar */}
                <div className="flex-1 relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-500 to-cyan-400 transition-all duration-1000 rounded-lg"
                    style={{ width: `${intensity}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-xs font-medium text-gray-600">
                      {city.views.toLocaleString()} مشاهدة
                    </span>
                  </div>
                </div>
                
                {/* Trend */}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  isPositiveTrend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isPositiveTrend ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-bold">{city.trend}</span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4 mr-14 text-xs text-gray-600">
                <span>👆 {city.clicks} نقرة</span>
                <span>✅ {city.conversions} تحويل</span>
                <span>📊 {((city.conversions / city.clicks) * 100).toFixed(1)}% معدل</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Export & Compare Buttons */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
        <button className="flex-1 py-3 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white rounded-lg font-medium hover:shadow-lg transition-all">
          تصدير التقرير 📊
        </button>
        <button className="flex-1 py-3 bg-white border-2 border-[#D4AF37] text-[#01411C] rounded-lg font-medium hover:bg-gray-50 transition-all">
          مقارنة الفترات 📈
        </button>
      </div>
    </div>
  );
}
