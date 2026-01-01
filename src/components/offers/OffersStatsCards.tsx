/**
 * OffersStatsCards.tsx
 * 4 مربعات إحصائيات المشاهدات والتفاعلات
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Calendar, CalendarDays, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface OffersStatsCardsProps {
  currentViews: number;
  monthlyViews: number;
  yearlyViews: number;
  totalInteractions: number;
  previousMonthViews?: number;
  previousYearViews?: number;
}

const OffersStatsCards: React.FC<OffersStatsCardsProps> = ({
  currentViews,
  monthlyViews,
  yearlyViews,
  totalInteractions,
  previousMonthViews = 0,
  previousYearViews = 0,
}) => {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const monthChange = calculateChange(monthlyViews, previousMonthViews);
  const yearChange = calculateChange(yearlyViews, previousYearViews);

  const stats = [
    {
      id: 'current',
      icon: <Eye className="w-6 h-6" />,
      value: currentViews,
      label: 'المشاهدات الآن',
      sublabel: 'مشاهد مباشر',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      animate: currentViews > 0,
    },
    {
      id: 'monthly',
      icon: <Calendar className="w-6 h-6" />,
      value: monthlyViews,
      label: 'المشاهدات الشهرية',
      sublabel: 'هذا الشهر',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: monthChange,
    },
    {
      id: 'yearly',
      icon: <CalendarDays className="w-6 h-6" />,
      value: yearlyViews,
      label: 'المشاهدات السنوية',
      sublabel: 'هذه السنة',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: yearChange,
    },
    {
      id: 'interactions',
      icon: <Activity className="w-6 h-6" />,
      value: totalInteractions,
      label: 'التفاعلات',
      sublabel: 'اتصال، رسالة، مشاركة',
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('ar-SA');
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-4 border border-white/50 shadow-lg hover:shadow-xl transition-shadow`}
        >
          {/* أيقونة الخلفية */}
          <div className="absolute -left-4 -bottom-4 opacity-10">
            <div className="w-24 h-24">
              {React.cloneElement(stat.icon, { className: 'w-24 h-24' })}
            </div>
          </div>

          {/* المحتوى */}
          <div className="relative z-10">
            {/* الأيقونة */}
            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3 shadow-sm`}>
              <div className={stat.iconColor}>
                {stat.icon}
              </div>
            </div>

            {/* القيمة */}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                {formatNumber(stat.value)}
              </span>
              {stat.animate && stat.value > 0 && (
                <motion.span
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </div>

            {/* التسمية */}
            <p className="text-sm font-semibold text-gray-700">{stat.label}</p>
            
            {/* التغيير أو الوصف */}
            <div className="mt-2 flex items-center gap-1">
              {stat.change !== undefined ? (
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                  <span className="text-gray-500">من الشهر السابق</span>
                </div>
              ) : (
                <span className="text-xs text-gray-500">{stat.sublabel}</span>
              )}
            </div>
          </div>

          {/* شريط التدرج في الأعلى */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
        </motion.div>
      ))}
    </div>
  );
};

export default OffersStatsCards;
