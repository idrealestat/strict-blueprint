import React from 'react';
import { Users, DollarSign, Package } from 'lucide-react';

export default function AdvancedOptionsPanel() {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8" dir="rtl">
      {/* إجراءات جماعية */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <Users className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">جديد</span>
        </div>
        <h3 className="text-xl font-bold mb-2">إجراءات جماعية</h3>
        <p className="text-sm opacity-90">إدارة عدة عروض دفعة واحدة</p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs opacity-80">تحديد • تعديل • نشر</div>
        </div>
      </div>
      
      {/* تحكم التسعير */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <DollarSign className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">ذكي</span>
        </div>
        <h3 className="text-xl font-bold mb-2">تحكم التسعير</h3>
        <p className="text-sm opacity-90">تحديث الأسعار تلقائياً</p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs opacity-80">تخفيضات • عروض • توصيات</div>
        </div>
      </div>
      
      {/* إدارة المخزون */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <Package className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">تلقائي</span>
        </div>
        <h3 className="text-xl font-bold mb-2">إدارة المخزون</h3>
        <p className="text-sm opacity-90">تتبع وإدارة التوفر</p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs opacity-80">متوفر • محجوز • منتهي</div>
        </div>
      </div>
    </div>
  );
}
