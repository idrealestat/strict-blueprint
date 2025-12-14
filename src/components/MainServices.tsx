/**
 * MainServices.tsx
 * الواجهة الرئيسية - 8 خدمات
 */

import { useNavigate } from 'react-router-dom';

interface Service {
  id: number;
  icon: string;
  title: string;
  description: string;
  color: string;
  link: string;
  stat: string;
}

const MainServices = () => {
  const navigate = useNavigate();

  const services: Service[] = [
    {
      id: 1,
      icon: '📊',
      title: 'لوحة التحكم',
      description: 'نظرة شاملة على أداء الأعمال',
      color: 'from-blue-500 to-cyan-500',
      link: '/dashboard',
      stat: '10 تحديثات جديدة'
    },
    {
      id: 2,
      icon: '👥',
      title: 'إدارة العملاء',
      description: 'نظام متكامل لإدارة علاقات العملاء',
      color: 'from-purple-500 to-pink-500',
      link: '/customers',
      stat: '45 عميل نشط'
    },
    {
      id: 3,
      icon: '💰',
      title: 'المعاملات المالية',
      description: 'إدارة التحويلات والمدفوعات',
      color: 'from-green-500 to-emerald-500',
      link: '/transactions',
      stat: '150 معاملة'
    },
    {
      id: 4,
      icon: '📈',
      title: 'التقارير والتحليلات',
      description: 'تقارير مفصلة وإحصائيات ذكية',
      color: 'from-orange-500 to-red-500',
      link: '/analytics',
      stat: '25 تقرير'
    },
    {
      id: 5,
      icon: '📋',
      title: 'إدارة العقود',
      description: 'إنشاء ومتابعة العقود',
      color: 'from-indigo-500 to-blue-500',
      link: '/contracts',
      stat: '12 عقد'
    },
    {
      id: 6,
      icon: '🎯',
      title: 'المبيعات والتسويق',
      description: 'أدوات التسويق وإدارة المبيعات',
      color: 'from-teal-500 to-green-500',
      link: '/sales',
      stat: '8 حملات'
    },
    {
      id: 7,
      icon: '⚙️',
      title: 'الإعدادات',
      description: 'تخصيص النظام والإعدادات',
      color: 'from-gray-600 to-gray-800',
      link: '/settings',
      stat: '15 إعداد'
    },
    {
      id: 8,
      icon: '🆘',
      title: 'الدعم الفني',
      description: 'مركز المساعدة والدعم',
      color: 'from-rose-500 to-pink-500',
      link: '/support',
      stat: '24/7'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => navigate(service.link)}
          className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-right"
        >
          {/* Gradient overlay on hover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
          />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl">{service.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {service.stat}
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <span className="text-lg">←</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MainServices;
