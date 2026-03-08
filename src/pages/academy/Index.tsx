import { Link, useSearchParams } from "react-router-dom";
import { getAcademyLogin, getAcademyRegister } from "@/utils/academyPaths";
import { ArrowRight } from "lucide-react";
import {
  Shield,
  TrendingUp,
  Award,
  Target,
  GraduationCap,
  Play,
  CheckCircle,
  XCircle,
  BookOpen,
  Scale,
  Megaphone,
  Users,
  Landmark,
  FileText,
  Globe,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import academyHero from "@/assets/academy-hero.jpg";
import skylineBg from "@/assets/academy-skyline-bg.jpg";

/* ═══════════════════════════════════════════════════════
   أكاديمية "اكسر حاجز المبتدئ"
   الصفحة الرئيسية — src/pages/academy/Index.tsx
   ═══════════════════════════════════════════════════════ */

// ─── بيانات المزايا (القسم 4) ───
const benefits = [
  {
    icon: Shield,
    emoji: "🛡️",
    title: "شارة المحترف (الدرع)",
    desc: "تحصل على شارة احترافية في ملفك الرقمي داخل تطبيق وسيط، تميزك كوسيط معتمد ومعترف بكفاءتك.",
  },
  {
    icon: TrendingUp,
    emoji: "⚡",
    title: "ضعف الفرص الذكية",
    desc: "بعد إتمام الدورات، تتضاعف حصتك اليومية من الفرص الذكية داخل المنصة من 5 إلى 10 فرص، مما يزيد فرص إغلاقك للصفقات.",
  },
  {
    icon: Award,
    emoji: "📜",
    title: "شهادة إتمام معتمدة",
    desc: "شهادة رقمية قابلة للتحقق والمشاركة على منصات التواصل، تثبت اجتيازك للبرنامج الاحترافي.",
  },
  {
    icon: Target,
    emoji: "🎯",
    title: "أولوية الظهور",
    desc: "يتمتع الخريجون بأولوية في ظهور ملفاتهم أمام العملاء الباحثين عن وسطاء موثوقين.",
  },
];

// ─── المقارنة (القسم 5) ───
const traditionalCons = [
  "تركيز على النظريات فقط.",
  "إهمال الجانب الأخلاقي وفن التواصل.",
  "تغفل تحديثات الأنظمة (إيجار، السجل العيني، تملك غير السعوديين).",
  "لا تقدم دعماً عملياً بعد الدورة.",
];

const academyPros = [
  "دمج بين المهارات العملية والأنظمة الحديثة.",
  "تأسيس أخلاقي وقيمي (فن الكلمة، الثقة، الصدق).",
  "مواكبة أحدث التشريعات حتى 2026 (فرز الوحدات، ضريبة التصرفات، تحديثات إيجار).",
  "مزايا حصرية بعد الدورة (الشارة، الفرص الذكية).",
];

// ─── محاور التدريب (القسم 6) ───
const curriculum = [
  { icon: Users, text: "الأساسيات الأخلاقية وفن التواصل." },
  { icon: Landmark, text: "أدوات المعرفة العقارية (البورصة، السجل العيني، العنوان الوطني)." },
  { icon: Scale, text: "مهارات البيع والتفاوض وإغلاق الصفقات." },
  { icon: FileText, text: "الجوانب القانونية (العقود، العمولات، العربون، منصة إيجار)." },
  { icon: Megaphone, text: "استراتيجيات التسويق الرقمي واستخدام PropTech." },
  { icon: BookOpen, text: "دليل شامل للفرز والدمج وإفراغات الورثة." },
  { icon: Globe, text: "تملك غير السعوديين (آخر تحديثات 2026)." },
];

// ─── شهادات (القسم 8) ───
const testimonials = [
  {
    text: "الكتاب غير نظرتي للمهنة تماماً، البدايات كانت مشتتة لكن هذا المنهج وضعني على الطريق الصحيح.",
    name: "عبدالله",
    role: "وسيط مبتدئ",
  },
  {
    text: "أخيراً كتاب يجمع بين القانون والتسويق والأخلاق، كنت أظن أني أعرف لكني اكتشفت أني كنت أفتقد للكثير.",
    name: "سارة",
    role: "مسوقة عقارية",
  },
];

/* ─── Glass card style ─── */
const glassCard =
  "bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]";
const floatingCard =
  "bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_70px_-10px_rgba(0,0,0,0.2),0_12px_28px_-8px_rgba(0,0,0,0.12)] transition-all duration-300";

// ═══════════════════════════════════════════════════════
const AcademyIndex = () => {
  const [searchParams] = useSearchParams();
  const fromApp = searchParams.get('from') === 'app';

  const handleBack = () => {
    if (fromApp) {
      window.location.href = '/app/dashboard';
    } else {
      window.close();
      window.history.back();
    }
  };

  return (
    <div
      className="min-h-screen font-[Cairo] text-gray-800 relative"
      dir="rtl"
    >
      {/* ─── Background: fixed skyline image with frosted overlay ─── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${skylineBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Frosted glass overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-gray-100/85 via-gray-50/80 to-white/90 backdrop-blur-sm" />

      {/* ─── Content ─── */}
      <div className="relative z-10">
        {/* ──────────────────── 1. الشريط العلوي (Header) ──────────────────── */}
        <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-700 hover:text-wasata-green transition"
                title={fromApp ? "العودة للتطبيق" : "إغلاق"}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <GraduationCap className="w-8 h-8 text-wasata-green" />
              <span className="text-xl font-bold tracking-tight text-gray-800">
                أكاديمية <span className="text-wasata-gold">اكسر حاجز المبتدئ</span>
              </span>
            </div>
            <div className="flex gap-3">
              <Link to={getAcademyLogin()}>
                <Button variant="ghost" className="text-gray-700 hover:bg-white/60">
                  تسجيل دخول
                </Button>
              </Link>
              <Link to={getAcademyRegister()}>
                <Button className="bg-wasata-green hover:bg-wasata-green-dark text-white font-bold shadow-lg shadow-wasata-green/20">
                  اشترك الآن
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ──────────────────── 2. القسم البطولي (Hero) ──────────────────── */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`${floatingCard} rounded-3xl p-10 text-center md:text-right space-y-6`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
                اكسر حاجز المبتدئ..
                <br />
                <span className="text-wasata-green">وأتمم صفقتك الأولى بمهارة!</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                برنامج تدريبي متكامل للوسطاء العقاريين، من التأسيس الأخلاقي إلى
                الإتقان القانوني والتقني، لتبني مسيرة نجاح واثقة في سوق العقارات
                السعودي.
              </p>
              <Link to={getAcademyRegister()}>
                <Button
                  size="lg"
                  className="bg-wasata-green hover:bg-wasata-green-dark text-white font-bold text-lg px-10 py-6 mt-4 shadow-xl shadow-wasata-green/25"
                >
                  ابدأ رحلتك الآن
                </Button>
              </Link>
            </div>
            <div className={`${floatingCard} rounded-3xl overflow-hidden`}>
              <img
                src={academyHero}
                alt="وسيط عقاري محترف يشرح لعميل"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ──────────────────── 3. نبذة عن البرنامج ──────────────────── */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className={`${floatingCard} rounded-3xl p-10 text-center space-y-6`}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                أكثر من مجرد دورات.. <span className="text-wasata-gold">إنها وثيقة تمكين</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                هذا البرنامج هو ثمرة رحلة شخصية، جمعت شتات الخبرات بين الخط والرسم
                والتقنية وفن التعامل، لتردم الفجوة التي يعيشها كثير من الوسطاء الجدد.
                ليس مجرد معلومات نظرية، بل دليل عملي يدمج بين مهارات البيع والتسويق
                وأحدث الأنظمة واللوائح الصادرة حتى مطلع عام 2026. هدفنا أن نعبر بك
                &laquo;حاجز البداية&raquo; بأمان، ونجنبك الوقوع في المخاطر، لتمارس
                مهنتك بذخيرة معرفية تجعلك خبيراً في عين عملائك منذ الصفقة الأولى.
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────── 4. المزايا الحصرية ──────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            مزايا لا تقتصر على الشهادة..{" "}
            <span className="text-wasata-gold">ترافقك في مسيرتك</span>
          </h2>
          <p className="text-gray-500 text-center mb-12">
            ما الذي ستحصل عليه بعد إتمام الدورات؟
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className={`${floatingCard} rounded-2xl p-6 text-center group hover:scale-[1.02]`}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-wasata-green/10 flex items-center justify-center group-hover:bg-wasata-green/20 transition">
                  <b.icon className="w-8 h-8 text-wasata-green" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────── 5. المقارنة الذكية ──────────────────── */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              لماذا تبدأ رحلتك <span className="text-wasata-green">معنا؟</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* العمود الأيمن — الدورات التقليدية */}
              <div className={`${floatingCard} rounded-2xl p-8 border-red-200/50`}>
                <h3 className="text-xl font-bold mb-6 text-red-500 text-center">
                  الدورات التقليدية
                </h3>
                <ul className="space-y-4">
                  {traditionalCons.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* العمود الأيسر — أكاديمية اكسر حاجز المبتدئ */}
              <div className={`${floatingCard} rounded-2xl p-8 border-wasata-green/30`}>
                <h3 className="text-xl font-bold mb-6 text-wasata-green text-center">
                  أكاديمية اكسر حاجز المبتدئ
                </h3>
                <ul className="space-y-4">
                  {academyPros.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-wasata-green mt-1 shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────── 6. محاور رحلتك التدريبية ──────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            محاور <span className="text-wasata-green">رحلتك التدريبية</span>
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {curriculum.map((item, i) => (
              <div
                key={i}
                className={`${floatingCard} flex items-center gap-4 rounded-xl p-4 hover:scale-[1.01]`}
              >
                <div className="w-11 h-11 rounded-full bg-wasata-green/15 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-wasata-green" />
                </div>
                <span className="text-base md:text-lg text-gray-800">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6">وتفاصيل أكثر في الدورات..</p>
        </section>

        {/* ──────────────────── 7. قسم الفيديو التعريفي ──────────────────── */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">
              شاهد بنفسك:{" "}
              <span className="text-wasata-green">
                الفرق الذي ستصنعه هذه الدورات في مسيرتك
              </span>
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className={`${floatingCard} aspect-video rounded-2xl flex flex-col items-center justify-center gap-4`}>
                <div className="w-20 h-20 rounded-full bg-wasata-green/15 flex items-center justify-center">
                  <Play className="w-10 h-10 text-wasata-green" />
                </div>
                <p className="text-gray-500 text-lg max-w-md px-4">
                  الفيديو التعريفي قيد الإعداد، تابعونا قريباً لتروا بأنفسكم تجارب
                  حقيقية لوسطاء غيرت مسارهم
                </p>
              </div>
              <p className="text-gray-500 mt-6 max-w-2xl mx-auto text-sm leading-relaxed">
                سنقوم قريباً بتصوير نماذج تفاعلية وحقيقية لوسطاء ميدانيين يشرحون
                كيف ساعدتهم هذه المبادئ في تجاوز أصعب العقبات. اشترك الآن لتصلك
                أولوية المشاهدة.
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────── 8. شهادات (Testimonials) ──────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            ماذا قالوا عن <span className="text-wasata-gold">التجربة؟</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`${floatingCard} rounded-2xl p-8 relative`}
              >
                <Quote className="w-8 h-8 text-wasata-gold/30 absolute top-6 left-6" />
                <p className="text-gray-600 text-lg leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-wasata-green">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────── 9. الدعوة للانضمام (CTA) ──────────────────── */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className={`${floatingCard} rounded-3xl p-12 max-w-2xl mx-auto space-y-6 bg-gradient-to-br from-white/80 to-wasata-gold/5`}>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900">
                لا تبدأ رحلتك متعثراً..
                <br />
                <span className="text-wasata-green">اكسر الحاجز وانطلق بثقة!</span>
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                الدورة تشمل وصولاً كاملاً لجميع محتويات البرنامج، مع تحديثات
                مستقبلية مدى الحياة على المحتوى القانوني.
              </p>
              <div>
                <p className="text-gray-500 text-sm mb-1">باقة الدورة الكاملة</p>
                <div className="text-5xl font-extrabold text-wasata-green">
                  299 ريال
                </div>
                <p className="text-gray-500 text-sm mt-1">مرة واحدة — وصول مدى الحياة</p>
              </div>
              <Link to={getAcademyRegister()}>
                <Button
                  size="lg"
                  className="bg-wasata-green hover:bg-wasata-green-dark text-white font-bold text-xl px-12 py-7 w-full max-w-sm mt-4 shadow-xl shadow-wasata-green/25"
                >
                  ابدأ رحلتك الآن
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────────────── 10. التذييل (Footer) ──────────────────── */}
        <footer className="border-t border-gray-200/60 py-8 bg-white/40 backdrop-blur-lg">
          <div className="container mx-auto px-4 text-center space-y-3">
            <p className="text-gray-600 text-sm">
              اكسر حاجز المبتدئ © {new Date().getFullYear()}. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center justify-center gap-4 text-gray-500 text-sm">
              <a href="#" className="hover:text-wasata-green transition">
                سياسة الخصوصية
              </a>
              <span>|</span>
              <a href="#" className="hover:text-wasata-green transition">
                الشروط والأحكام
              </a>
            </div>
            <p className="text-gray-400 text-xs">
              التسجيل في البرنامج يتطلب رقم رخصة فال.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AcademyIndex;
