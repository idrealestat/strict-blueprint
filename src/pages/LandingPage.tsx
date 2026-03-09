import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Building2, Bot, BriefcaseBusiness, CreditCard, LayoutGrid, Sparkles, Star, Users, Workflow } from "lucide-react";
import heroBroker from "@/assets/hero-broker.png";
import brokerFemale from "@/assets/landing-broker-female.jpg";
import teamSuccess from "@/assets/landing-team-success.jpg";

const features = [
  {
    icon: LayoutGrid,
    title: "منصّتك العقارية الخاصة",
    text: "لكل وسيط منصة احترافية تعرض عقاراته وخدماته بأسلوب يليق باسمه.",
  },
  {
    icon: Users,
    title: "إدارة عملاء ديناميكية",
    text: "متابعة دقيقة للعملاء، الحالات، الملاحظات، والمواعيد في مكان واحد.",
  },
  {
    icon: Workflow,
    title: "أتمتة عمل الوسيط",
    text: "تقليل الأعمال المتكررة وتسريع الإنجاز اليومي بذكاء عملي.",
  },
  {
    icon: Sparkles,
    title: "فرص ذكية",
    text: "اكتشاف فرص تناسب عقاراتك وملفات عملائك بصورة أسرع وأدق.",
  },
  {
    icon: BriefcaseBusiness,
    title: "بطاقة أعمال رسمية",
    text: "حضور موثوق يعزز ثقة العملاء من أول تواصل.",
  },
  {
    icon: CreditCard,
    title: "بطاقة أعمال رقمية",
    text: "مشاركة فورية لبياناتك وروابطك المهنية بأسلوب حديث.",
  },
  {
    icon: Star,
    title: "تقييم الوسيط",
    text: "بناء سمعة مهنية قابلة للنمو عبر تجربة عميل ممتازة.",
  },
  {
    icon: Bot,
    title: "فورمات ذكية مؤتمتة",
    text: "نماذج ومهام جاهزة تختصر الوقت وتزيد جودة التنفيذ.",
  },
  {
    icon: Building2,
    title: "إدارة متكاملة",
    text: "من التسويق حتى الإقفال، كل خطواتك التشغيلية تحت تحكمك.",
  },
];

const testimonials = [
  {
    name: "عبدالرحمن – وسيط عقاري",
    quote: "من أول أسبوع حسّيت أني أشتغل بهدوء أكثر، وكل ملف صار واضح أمامي بدون تشتيت.",
  },
  {
    name: "نورة – مستشارة عقارية",
    quote: "المنصة فعلاً اختصرت وقتي في المتابعة والتنسيق، وصار عندي حضور مهني أقوى مع العملاء.",
  },
  {
    name: "محمد – مدير فريق مبيعات",
    quote: "الفرص الذكية والأتمتة رفعت إنتاجية الفريق بشكل ملحوظ، ونتائجنا صارت أسرع.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>وساطة | منصة الوسيط العقاري الذكية</title>
        <meta
          name="description"
          content="منصة عقارية متكاملة للوسطاء: إدارة عملاء ديناميكية، فرص ذكية، أتمتة العمليات، وبطاقة أعمال رسمية ورقمية في نظام واحد."
        />
        <link rel="canonical" href="/" />
      </Helmet>

      <header className="relative min-h-[85vh] overflow-hidden">
        <img
          src={heroBroker}
          alt="وسيط عقاري سعودي محترف"
          className="absolute inset-0 h-full w-full object-cover object-[65%_top]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--primary)/0.88),hsl(var(--primary)/0.62),hsl(var(--secondary)/0.26))]" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center gap-6 px-6 pb-16 pt-24 lg:px-10 lg:pt-20">
          <p className="w-fit rounded-full border border-secondary/60 bg-background/10 px-4 py-1 text-sm text-primary-foreground backdrop-blur">
            بكل فخر واعتزاز للوسيط العقاري السعودي
          </p>
          <h1 className="max-w-3xl text-2xl font-bold leading-relaxed text-primary-foreground sm:text-3xl lg:text-4xl">
            منصتك الذكية التي تجعل عملك العقاري أسرع، أوضح، وأكثر تأثيراً.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/90">
            نعلم تمامًا ما تحتاجه كوسيط عقاري — لذلك صمّمنا لك أدوات تخدم عملك اليومي فعليًا، تبني ثقة عميلك من أول تواصل، وتختصر وقتك لتركّز على ما يهم: إتمام الصفقات وتحقيق النتائج.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/app/register"
              className="rounded-lg bg-secondary px-6 py-3 text-base font-bold text-secondary-foreground transition hover:opacity-90"
            >
              ابدأ الآن
            </Link>
            <Link
              to="/app/login"
              className="rounded-lg border border-primary-foreground/50 bg-background/10 px-6 py-3 text-base font-bold text-primary-foreground backdrop-blur transition hover:bg-background/20"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">لماذا هذه المنصة؟</h2>
              <p className="mt-2 text-muted-foreground">كل ما يهم الوسيط العقاري الحديث في نظام عملي واحد.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5">
                  <div className="mb-4 inline-flex rounded-xl bg-accent p-3 text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-2 lg:px-10">
          <article className="overflow-hidden rounded-3xl border border-border bg-card">
            <img
              src={brokerFemale}
              alt="وسيطة عقارية سعودية في مكتب فاخر"
              className="h-80 w-full object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold">احترافية تعكس هويتك</h3>
              <p className="mt-2 text-muted-foreground">
                واجهة حديثة وهوية قوية تساعدك على تقديم خدماتك بثقة ووضوح.
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-border bg-card">
            <img
              src={teamSuccess}
              alt="فريق وساطة عقارية سعيد أثناء العمل عبر الجوال والمكتب"
              className="h-80 w-full object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold">سعادة في الإنجاز اليومي</h3>
              <p className="mt-2 text-muted-foreground">
                عندما تختصر وقتك في الأعمال المكررة، يتبقى لك وقت البيع والعلاقات.
              </p>
            </div>
          </article>
        </section>

        <section className="gradient-main border-y border-border">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <h2 className="text-3xl font-bold">ماذا قالوا عن التطبيق؟</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote key={item.name} className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-base leading-8">“{item.quote}”</p>
                  <footer className="mt-4 text-sm font-bold text-muted-foreground">{item.name}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-3xl gradient-header p-8 text-primary-foreground lg:p-12">
            <h2 className="text-3xl font-bold">جاهز ترفع مستوى عملك العقاري؟</h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/90">
              انضم الآن، وابدأ بإدارة عملائك وعقاراتك بذكاء يجذبك نفسياً قبل أن يخدمك عملياً.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/app/register"
                className="rounded-lg bg-secondary px-6 py-3 font-bold text-secondary-foreground transition hover:opacity-90"
              >
                إنشاء حساب جديد
              </Link>
              <Link
                to="/app/login"
                className="rounded-lg border border-primary-foreground/50 bg-background/10 px-6 py-3 font-bold text-primary-foreground transition hover:bg-background/20"
              >
                لدي حساب بالفعل
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
