import { Link } from "react-router-dom";
import { Shield, Star, TrendingUp, Award, CheckCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Shield, title: "شارة درع في ملفك الرقمي", desc: "تميز عن الآخرين بشارة الوسيط المحترف" },
  { icon: TrendingUp, title: "زيادة الفرص الذكية إلى 10 يومياً", desc: "احصل على فرص أكثر وعملاء جدد" },
  { icon: Award, title: "شهادة إتمام معتمدة", desc: "شهادة قابلة للمشاركة تعزز مصداقيتك" },
  { icon: Star, title: "أولوية في الظهور للعملاء", desc: "تصدّر نتائج البحث عن الوسطاء" },
];

const testimonials = [
  { name: "أحمد المحمدي", role: "وسيط عقاري - الرياض", text: "الدورات ممتازة وعملية، حصلت على شهادتي خلال أسبوع وزادت فرصي بشكل ملحوظ." },
  { name: "سارة العتيبي", role: "مديرة مكتب عقاري - جدة", text: "محتوى احترافي ومتوافق مع أنظمة الهيئة العامة للعقار." },
  { name: "خالد الشمري", role: "وسيط معتمد - الدمام", text: "بعد إتمام التدريب زادت مبيعاتي 40% وحصلت على ثقة أكبر من العملاء." },
];

const curriculum = [
  "مقدمة في الوساطة العقارية",
  "القوانين والأنظمة العقارية السعودية",
  "فن التفاوض العقاري",
  "التسويق العقاري الرقمي",
  "تقييم العقارات وتحديد الأسعار",
];

const AcademyLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] text-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a1628]/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl font-bold">أكاديمية وسيط</span>
          </div>
          <div className="flex gap-3">
            <Link to="/academy/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">تسجيل دخول</Button>
            </Link>
            <Link to="/academy/register">
              <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold">اشترك الآن</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
          كن وسيطاً عقارياً معتمداً<br />
          <span className="text-[#D4AF37]">بشهادة احترافية</span>
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          دورات تدريبية متخصصة في الوساطة العقارية، معتمدة ومتوافقة مع أنظمة الهيئة العامة للعقار
        </p>
        <div className="aspect-video max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="فيديو تعريفي"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Link to="/academy/register">
          <Button size="lg" className="bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold text-lg px-10 py-6">
            ابدأ الآن
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">مميزات إتمام التدريب</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition">
              <f.icon className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">المحتوى التدريبي</h2>
        <div className="max-w-xl mx-auto space-y-4">
          {curriculum.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                {i + 1}
              </div>
              <span className="text-lg">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">آراء الوسطاء</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">"{t.text}"</p>
              <div>
                <p className="font-bold text-[#D4AF37]">{t.name}</p>
                <p className="text-sm text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-3xl p-12 max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-4">سعر الدورة</h2>
          <div className="text-5xl font-extrabold text-[#D4AF37] mb-2">299 ريال</div>
          <p className="text-gray-400 mb-8">لمرة واحدة - وصول مدى الحياة</p>
          <Link to="/academy/register">
            <Button size="lg" className="bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold text-lg px-10 py-6 w-full">
              ابدأ الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        <p>التسجيل يتطلب رقم رخصة فال ساري المفعول</p>
        <p className="mt-2">© {new Date().getFullYear()} أكاديمية وسيط - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default AcademyLanding;
