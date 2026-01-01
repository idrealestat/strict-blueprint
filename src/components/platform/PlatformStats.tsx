/**
 * PlatformStats.tsx
 * إحصائيات المنصة - يظهر ملخص للعروض المتاحة
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Eye,
  Home,
  Warehouse,
  LandPlot,
  Building
} from 'lucide-react';

interface PlatformStatsProps {
  totalListings: number;
  citiesCount: number;
  propertyTypes: { [key: string]: number };
  averagePrice: number;
  totalViews: number;
}

const PlatformStats: React.FC<PlatformStatsProps> = ({
  totalListings,
  citiesCount,
  propertyTypes,
  averagePrice,
  totalViews
}) => {
  const getPropertyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'شقة':
      case 'apartment':
        return <Building2 className="w-5 h-5" />;
      case 'فيلا':
      case 'villa':
        return <Home className="w-5 h-5" />;
      case 'أرض':
      case 'land':
        return <LandPlot className="w-5 h-5" />;
      case 'تجاري':
      case 'commercial':
        return <Warehouse className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} مليون`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)} ألف`;
    }
    return price.toLocaleString();
  };

  const stats = [
    {
      icon: <Building2 className="w-6 h-6 text-[#01411C]" />,
      value: totalListings,
      label: 'عقار متاح',
      color: 'from-green-50 to-green-100',
      border: 'border-green-200'
    },
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      value: citiesCount,
      label: 'مدينة',
      color: 'from-blue-50 to-blue-100',
      border: 'border-blue-200'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      value: formatPrice(averagePrice),
      label: 'متوسط السعر',
      color: 'from-purple-50 to-purple-100',
      border: 'border-purple-200'
    },
    {
      icon: <Eye className="w-6 h-6 text-amber-600" />,
      value: totalViews,
      label: 'مشاهدة',
      color: 'from-amber-50 to-amber-100',
      border: 'border-amber-200'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      {/* العنوان */}
      <h2 className="text-xl font-bold text-[#01411C] mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
        إحصائيات المنصة
      </h2>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-center border-2 ${stat.border}`}
          >
            <div className="flex justify-center mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* توزيع أنواع العقارات */}
      {Object.keys(propertyTypes).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-3">توزيع أنواع العقارات</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(propertyTypes).map(([type, count], index) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200"
              >
                <span className="text-[#01411C]">{getPropertyIcon(type)}</span>
                <span className="font-medium text-gray-800">{type}</span>
                <span className="bg-[#01411C] text-white text-xs px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformStats;
