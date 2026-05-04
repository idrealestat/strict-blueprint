import { Link } from "react-router-dom";
import { Search, Home, Handshake } from "lucide-react";

export default function HeroPortalSection() {
  return (
    <section
      dir="rtl"
      className="relative w-full bg-gradient-to-b from-[#01411C] via-[#065f41] to-[#01411C] text-white py-20 px-4"
    >
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="font-cairo text-4xl md:text-6xl font-bold mb-4">
          بوابتك الذكية للعقار
        </h1>
        <p className="font-cairo text-xl md:text-2xl text-[#D4AF37] mb-12">
          من التيه... إلى التمكن
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            to="/search"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105"
          >
            <Search className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
            <h3 className="font-cairo text-xl font-bold mb-2">ابحث عن عقار</h3>
            <p className="font-cairo text-sm text-white/80">استكشف عقارات مناسبة لك</p>
          </Link>

          <Link
            to="/offer-property"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105"
          >
            <Home className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
            <h3 className="font-cairo text-xl font-bold mb-2">اعرض عقارك</h3>
            <p className="font-cairo text-sm text-white/80">انشر عقارك للبيع أو التأجير</p>
          </Link>

          <Link
            to="/huna-waseetak"
            className="group bg-[#D4AF37] text-[#01411C] border-2 border-[#D4AF37] rounded-2xl p-8 hover:bg-[#c19f2c] transition-all hover:scale-105 shadow-2xl"
          >
            <Handshake className="w-12 h-12 mx-auto mb-4" />
            <h3 className="font-cairo text-xl font-bold mb-2">هنا وسيطك</h3>
            <p className="font-cairo text-sm opacity-90">اطلب وسيطًا موثوقًا الآن</p>
          </Link>
        </div>
      </div>
    </section>
  );
}