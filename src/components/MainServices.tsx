/**
 * MainServices.tsx
 * الواجهة الرئيسية - 8 خدمات
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [tooltipService, setTooltipService] = useState<Service | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

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

  const handleTouchStart = useCallback((service: Service, e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    isLongPress.current = false;
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setTooltipService(service);
    }, 500);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback((service: Service) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    navigate(service.link);
  }, [navigate]);

  const closeTooltip = useCallback(() => {
    setTooltipService(null);
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleClick(service)}
            onTouchStart={(e) => handleTouchStart(service, e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-right"
          >
            {/* Gradient overlay on hover */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
            />
            
            <div className="relative z-10">
              {/* Mobile: فقط الأيقونة والعنوان */}
              {isMobile ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className="text-4xl">{service.icon}</div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm text-center leading-tight">
                    {service.title}
                  </h3>
                </div>
              ) : (
                /* Desktop: العرض الكامل */
                <>
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
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Tooltip - رسالة سحابية عند اللمس المطول */}
      {tooltipService && (
        <div 
          className="fixed inset-0 z-50"
          onClick={closeTooltip}
          onTouchStart={closeTooltip}
        >
          <div 
            className="absolute bg-gradient-to-br from-emerald-700 to-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-amber-500 max-w-[280px] animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* مثلث الفقاعة */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-500"
            />
            <div 
              className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-emerald-800"
            />
            
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{tooltipService.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-400 mb-1">{tooltipService.title}</h4>
                <p className="text-sm text-white/90 leading-relaxed">{tooltipService.description}</p>
                <div className="mt-2 text-xs text-amber-300/80">{tooltipService.stat}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainServices;
