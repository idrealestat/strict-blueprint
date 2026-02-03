import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Scale, Shield, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 1,
      titleAr: "التعريفات",
      titleEn: "Definitions",
      contentAr: [
        "**المنصة / التطبيق / Wasata AI**: منصة رقمية للوساطة العقارية.",
        "**الشركة / نحن / لنا**: الكيان المشغل للمنصة.",
        "**المستخدم / أنت**: أي فرد أو مؤسسة يستخدم المنصة.",
        "**المعلن**: المالك أو الوسيط العقاري المرخّص."
      ],
      contentEn: [
        "**Platform / App / Wasata AI**: Digital real estate brokerage platform.",
        "**Company / We / Us**: Entity operating the platform.",
        "**User / You**: Any individual or entity using the platform.",
        "**Advertiser**: Licensed owner or real estate broker posting listings."
      ]
    },
    {
      id: 2,
      titleAr: "قبول الشروط",
      titleEn: "Acceptance",
      contentAr: [
        "باستخدام التطبيق، أنت توافق على جميع الشروط وسياسة الخصوصية. في حال عدم الموافقة، توقف عن الاستخدام."
      ],
      contentEn: [
        "By using the app, you agree to all terms and privacy policy. If you disagree, stop using the platform."
      ]
    },
    {
      id: 3,
      titleAr: "شروط النشر",
      titleEn: "Listing Rules",
      contentAr: [
        "1. النشر فقط للمعلنين السعوديين أو غير السعوديين للعقارات المملوكة لهم حصريًا.",
        "2. التحقق عبر **نفاذ الوطني**.",
        "3. يجب أن يتضمن الإعلان: نوع العقار، الموقع، رقم الترخيص، الإفصاحات القانونية.",
        "4. وسم \"مرخّص\" تلقائي عند مطابقة البيانات.",
        "5. إزالة الإعلان بعد إتمام الصفقة خلال يومين.",
        "6. مخالفة الضوابط قد تؤدي لتعليق الحساب."
      ],
      contentEn: [
        "1. Posting allowed only for Saudi or non-Saudi owners of their exclusive properties.",
        "2. Verification via **National Access (Nafath)**.",
        "3. Listing must include: property type, location, license number, legal disclosures.",
        "4. Automatically tagged as \"Licensed\" when data matches.",
        "5. Remove listing within 2 days after transaction completion.",
        "6. Violations may lead to account suspension."
      ]
    },
    {
      id: 4,
      titleAr: "استخدام التطبيق والقيود",
      titleEn: "App Use & Restrictions",
      contentAr: [
        "• لا تعديل أو نسخ المحتوى بدون إذن.",
        "• لا استخدام تجاري خارج التطبيق.",
        "• عدم نشر محتوى مضلل أو خادش للحياء.",
        "• الالتزام بالقوانين السعودية."
      ],
      contentEn: [
        "• Do not modify or copy content without permission.",
        "• No commercial use outside the app.",
        "• Do not post misleading or offensive content.",
        "• Comply with Saudi laws."
      ]
    },
    {
      id: 5,
      titleAr: "إخلاء المسؤولية",
      titleEn: "Disclaimer",
      contentAr: [
        "• المنصة وسيط تقني فقط، غير مسؤولة عن أي إعلان غير صحيح أو غش من المعلنين.",
        "• أي استخدام للمعلومات يكون على مسؤوليتك.",
        "• الشركة غير مسؤولة عن أي خسائر مباشرة أو غير مباشرة أو أعطال تقنية."
      ],
      contentEn: [
        "• The platform is only a technical intermediary and not responsible for false listings or advertiser fraud.",
        "• Any use of information is at your own risk.",
        "• The company is not liable for direct/indirect losses or technical issues."
      ]
    },
    {
      id: 6,
      titleAr: "خدمات الطرف الثالث",
      titleEn: "Third-Party Services",
      contentAr: [
        "• أي روابط أو خدمات طرف ثالث للتسهيل فقط.",
        "• الشركة غير مسؤولة عن محتواها أو دقتها.",
        "• الالتزام بشروط الطرف الثالث عند استخدامها."
      ],
      contentEn: [
        "• Any third-party links/services are for convenience only.",
        "• The company is not responsible for their content or accuracy.",
        "• Comply with third-party terms when using them."
      ]
    },
    {
      id: 7,
      titleAr: "التعويض",
      titleEn: "Indemnification",
      contentAr: [
        "أنت توافق على تعويض وإعفاء المنصة وموظفيها ووكلائها من أي مطالبات أو أضرار نتيجة استخدامك للتطبيق أو انتهاكك للشروط."
      ],
      contentEn: [
        "You agree to indemnify and hold the platform, employees, and agents harmless from any claims or damages arising from your use of the app or violation of terms."
      ]
    },
    {
      id: 8,
      titleAr: "القانون والاختصاص القضائي",
      titleEn: "Governing Law & Jurisdiction",
      contentAr: [
        "• تخضع الشروط لقوانين المملكة العربية السعودية.",
        "• الاختصاص القضائي لمُحاكم الرياض.",
        "• إذا بطل أي بند، تبقى بقية البنود سارية."
      ],
      contentEn: [
        "• Terms are governed by Saudi Arabian law.",
        "• Jurisdiction is with Riyadh courts.",
        "• If any clause is invalid, remaining clauses remain effective."
      ]
    }
  ];

  const renderText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 text-slate-900" />
              </div>
              <div className="text-center md:text-right">
                <h1 className="text-xl md:text-2xl font-bold text-white">Wasata AI</h1>
                <p className="text-amber-400 text-sm">Real Estate Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-white/80 text-sm">شروط الاستخدام | Terms of Service</span>
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
            شروط الاستخدام
          </h2>
          <h3 className="text-xl md:text-3xl font-semibold text-amber-400">
            Terms of Service
          </h3>
          <p className="text-white/60 mt-4 text-sm md:text-base">
            آخر تحديث: فبراير 2025 | Last Updated: February 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/30 transition-colors"
            >
              {/* Section Header */}
              <div className="bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 px-4 md:px-6 py-4 border-b border-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                  <h4 dir="ltr" className="text-lg md:text-xl font-semibold text-amber-400 order-2 md:order-1">
                    {section.id}. {section.titleEn}
                  </h4>
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold order-1 md:order-2">
                    {section.id}
                  </div>
                  <h4 dir="rtl" className="text-lg md:text-xl font-semibold text-white order-3">
                    {section.id}. {section.titleAr}
                  </h4>
                </div>
              </div>

              {/* Section Content - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                {/* Arabic Content - Right Side */}
                <div
                  dir="rtl"
                  className="p-4 md:p-6 bg-slate-800/30 border-b md:border-b-0 md:border-l border-slate-700/50 order-1 md:order-2"
                >
                  <div className="space-y-3">
                    {section.contentAr.map((item, idx) => (
                      <p
                        key={idx}
                        className="text-white/90 leading-relaxed text-sm md:text-base"
                        dangerouslySetInnerHTML={{ __html: renderText(item) }}
                      />
                    ))}
                  </div>
                </div>

                {/* English Content - Left Side */}
                <div
                  dir="ltr"
                  className="p-4 md:p-6 bg-slate-800/20 order-2 md:order-1"
                >
                  <div className="space-y-3">
                    {section.contentEn.map((item, idx) => (
                      <p
                        key={idx}
                        className="text-white/80 leading-relaxed text-sm md:text-base"
                        dangerouslySetInnerHTML={{ __html: renderText(item) }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-amber-500/10 rounded-2xl border border-amber-500/20 p-6 md:p-8">
          <div className="text-center mb-6">
            <p className="text-white/80 mb-2">
              باستخدامك للمنصة، فإنك توافق على هذه الشروط والأحكام
            </p>
            <p className="text-white/60 text-sm">
              By using the platform, you agree to these terms and conditions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold px-8 py-3 rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>العودة للتطبيق</span>
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 px-8 py-3 rounded-xl flex items-center gap-2"
            >
              <span>Back to App</span>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 pb-8">
          <p className="text-white/40 text-sm">
            © 2025 Wasata AI. جميع الحقوق محفوظة | All Rights Reserved
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
