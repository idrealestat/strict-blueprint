/**
 * BusinessCard.tsx
 * بطاقة الأعمال - تصميم متوهج داكن
 */

const BusinessCard = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl p-8">
      {/* الخلفية المتوهجة */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* الشعار والاسم */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">BZ</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Business Zone</h1>
            <p className="text-gray-300">حلول أعمال متكاملة للقرن الحادي والعشرين</p>
          </div>
        </div>
        
        {/* المعلومات */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-2">المؤسس والرئيس التنفيذي</div>
            <div className="text-white font-medium">أحمد محمد</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-2">سنة التأسيس</div>
            <div className="text-white font-medium">٢٠١٠</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-2">عدد العملاء</div>
            <div className="text-white font-medium">+١٠٬٠٠٠</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-2">معدل الرضا</div>
            <div className="text-white font-medium">٩٨٫٧٪</div>
          </div>
        </div>
        
        {/* الاتصال */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <a href="tel:+966500000000" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <span className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  📞
                </span>
                <span>+٩٦٦ ٥٠ ٠٠٠ ٠٠٠٠</span>
              </a>
              <a href="mailto:info@businesszone.com" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <span className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  ✉️
                </span>
                <span>info@businesszone.com</span>
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                تواصل معنا
              </button>
              <button className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                الموقع الإلكتروني
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
