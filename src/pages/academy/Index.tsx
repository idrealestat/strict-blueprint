import { Link } from "react-router-dom";
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

// ═══════════════════════════════════════════════════════
const AcademyIndex = () => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[hsl(145,96%,5%)] to-[hsl(145,60%,12%)] text-white font-[Cairo]"
      dir="rtl"
    >
      {/* ──────────────────── 1. الشريط العلوي (Header) ──────────────────── */}
      <header className="sticky top-0 z-50 bg-[hsl(145,96%,5%)]/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="text-xl font-bold tracking-tight">
              أكاديمية <span className="text-secondary">اكسر حاجز المبتدئ</span>
            </span>
          </div>
          <div className="flex gap-3">
            <Link to="/academy/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                تسجيل دخول
              </Button>
            </Link>
            <Link to="/academy/register">
              <Button className="bg-secondary hover:bg-secondary/85 text-primary font-bold">
                اشترك الآن
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────── 2. القسم البطولي (Hero) ──────────────────── */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-right space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              اكسر حاجز المبتدئ..
              <br />
              <span className="text-secondary">وأتمم صفقتك الأولى بمهارة!</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-xl">
              برنامج تدريبي متكامل للوسطاء العقاريين، من التأسيس الأخلاقي إلى
              الإتقان القانوني والتقني، لتبني مسيرة نجاح واثقة في سوق العقارات
              السعودي.
            </p>
            <Link to="/academy/register">
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/85 text-primary font-bold text-lg px-10 py-6 mt-4"
              >
                ابدأ رحلتك الآن
              </Button>
            </Link>
          </div>
          {/* TODO: استبدال الصورة بصورة رسمية للأكاديمية لاحقاً */}
          <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
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
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            أكثر من مجرد دورات.. <span className="text-secondary">إنها وثيقة تمكين</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            هذا البرنامج هو ثمرة رحلة شخصية، جمعت شتات الخبرات بين الخط والرسم
            والتقنية وفن التعامل، لتردم الفجوة التي يعيشها كثير من الوسطاء الجدد.
            ليس مجرد معلومات نظرية، بل دليل عملي يدمج بين مهارات البيع والتسويق
            وأحدث الأنظمة واللوائح الصادرة حتى مطلع عام 2026. هدفنا أن نعبر بك
            &laquo;حاجز البداية&raquo; بأمان، ونجنبك الوقوع في المخاطر، لتمارس
            مهنتك بذخيرة معرفية تجعلك خبيراً في عين عملائك منذ الصفقة الأولى.
          </p>
        </div>
      </section>

      {/* ──────────────────── 4. المزايا الحصرية ──────────────────── */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          مزايا لا تقتصر على الشهادة..{" "}
          <span className="text-secondary">ترافقك في مسيرتك</span>
        </h2>
        <p className="text-gray-400 text-center mb-12">
          ما الذي ستحصل عليه بعد إتمام الدورات؟
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-secondary/40 transition-all duration-300 group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/15 flex items-center justify-center group-hover:bg-secondary/25 transition">
                <b.icon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── 5. المقارنة الذكية ──────────────────── */}
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            لماذا تبدأ رحلتك <span className="text-secondary">معنا؟</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* العمود الأيمن — الدورات التقليدية */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-red-400 text-center">
                الدورات التقليدية
              </h3>
              <ul className="space-y-4">
                {traditionalCons.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* العمود الأيسر — أكاديمية اكسر حاجز المبتدئ */}
            <div className="bg-emerald-950/20 border border-secondary/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 text-secondary text-center">
                أكاديمية اكسر حاجز المبتدئ
              </h3>
              <ul className="space-y-4">
                {academyPros.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary mt-1 shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── 6. محاور رحلتك التدريبية ──────────────────── */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          محاور <span className="text-secondary">رحلتك التدريبية</span>
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {curriculum.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-secondary/30 transition"
            >
              <div className="w-11 h-11 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-base md:text-lg">{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 mt-6">وتفاصيل أكثر في الدورات..</p>
      </section>

      {/* ──────────────────── 7. قسم الفيديو التعريفي (Placeholder) ──────────────────── */}
      {/* TODO: استبدال هذا الـ placeholder بفيديو يوتيوب أو فيديو مباشر من مصادر الأكاديمية لاحقاً */}
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            شاهد بنفسك:{" "}
            <span className="text-secondary">
              الفرق الذي ستصنعه هذه الدورات في مسيرتك
            </span>
          </h2>
          <div className="max-w-3xl mx-auto">
            {/* Video placeholder */}
            <div className="aspect-video bg-black/40 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-default">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                <Play className="w-10 h-10 text-secondary" />
              </div>
              <p className="text-gray-400 text-lg max-w-md px-4">
                الفيديو التعريفي قيد الإعداد، تابعونا قريباً لتروا بأنفسكم تجارب
                حقيقية لوسطاء غيرت مسارهم
              </p>
            </div>
            <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-sm leading-relaxed">
              سنقوم قريباً بتصوير نماذج تفاعلية وحقيقية لوسطاء ميدانيين يشرحون
              كيف ساعدتهم هذه المبادئ في تجاوز أصعب العقبات. اشترك الآن لتصلك
              أولوية المشاهدة.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────── 8. شهادات (Testimonials) ──────────────────── */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          ماذا قالوا عن <span className="text-secondary">التجربة؟</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 relative"
            >
              <Quote className="w-8 h-8 text-secondary/30 absolute top-6 left-6" />
              <p className="text-gray-300 text-lg leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="font-bold text-secondary">{t.name}</p>
                <p className="text-sm text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── 9. الدعوة للانضمام (CTA) ──────────────────── */}
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-3xl p-12 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              لا تبدأ رحلتك متعثراً..
              <br />
              <span className="text-secondary">اكسر الحاجز وانطلق بثقة!</span>
            </h2>
            <p className="text-gray-300 max-w-lg mx-auto">
              الدورة تشمل وصولاً كاملاً لجميع محتويات البرنامج، مع تحديثات
              مستقبلية مدى الحياة على المحتوى القانوني.
            </p>
            {/* TODO: تعديل السعر أو جعله مجانياً مؤقتاً حسب الحاجة */}
            <div>
              <p className="text-gray-400 text-sm mb-1">باقة الدورة الكاملة</p>
              <div className="text-5xl font-extrabold text-secondary">
                299 ريال
              </div>
              <p className="text-gray-400 text-sm mt-1">مرة واحدة — وصول مدى الحياة</p>
            </div>
            <Link to="/academy/register">
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/85 text-primary font-bold text-xl px-12 py-7 w-full max-w-sm mt-4"
              >
                ابدأ رحلتك الآن
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────── 10. التذييل (Footer) ──────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center space-y-3">
          <p className="text-gray-300 text-sm">
            اكسر حاجز المبتدئ © {new Date().getFullYear()}. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
            {/* TODO: ربط صفحات سياسة الخصوصية والشروط لاحقاً */}
            <a href="#" className="hover:text-secondary transition">
              سياسة الخصوصية
            </a>
            <span>|</span>
            <a href="#" className="hover:text-secondary transition">
              الشروط والأحكام
            </a>
          </div>
          <p className="text-gray-500 text-xs">
            التسجيل في البرنامج يتطلب رقم رخصة فال.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AcademyIndex;
