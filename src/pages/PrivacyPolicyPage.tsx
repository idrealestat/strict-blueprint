import { Helmet } from "react-helmet-async";

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy / سياسة الخصوصية - Wasata AI</title>
        <meta name="description" content="سياسة الخصوصية لتطبيق وساطة AI - Privacy Policy for Wasata AI" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              سياسة الخصوصية
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
              Privacy Policy
            </h2>
            <div className="mt-4 h-1 w-24 bg-primary mx-auto rounded-full" />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Arabic Section - Right */}
            <div className="order-1 lg:order-2 bg-card rounded-2xl shadow-lg p-6 md:p-8 border" dir="rtl">
              <div className="space-y-6 text-right">
                <Section
                  title="سياسة الخصوصية"
                  content="تدرك شركة Wasata AI وأي شركات أو خدمات مرتبطة بها أهمية خصوصية بيانات المستخدمين. تم إعداد هذه السياسة لتوضيح كيفية جمع واستخدام ومشاركة البيانات عند استخدام تطبيقنا."
                />
                
                <Section
                  title="جمع المعلومات"
                  content="نجمع معلوماتك الشخصية مثل الاسم، رقم الهاتف، البريد الإلكتروني، بيانات الدفع، ونشاطك داخل التطبيق لضمان تقديم خدمة مخصصة وفعّالة."
                />
                
                <Section
                  title="استخدام المعلومات"
                  content="نستخدم المعلومات لتقديم خدمات Wasata AI، تحسين تجربتك، التواصل معك عند الحاجة، وعرض الفرص والتوصيات العقارية المناسبة."
                />
                
                <Section
                  title="الإفصاح عن المعلومات"
                  content="قد نشارك بياناتك مع شركاء الخدمة، أو الوسطاء العقاريين، أو مزودي الخدمات المرتبطين بالتطبيق لتنفيذ الخدمات المطلوبة، مع الالتزام بالقوانين المحلية."
                />
                
                <Section
                  title="الأمن"
                  content="نطبق جميع الإجراءات المعقولة لحماية بياناتك من الوصول أو الاستخدام أو التغيير غير المصرح به."
                />
                
                <Section
                  title="حقوق المستخدم"
                  content="لديك الحق في الوصول إلى بياناتك، تصحيحها، أو طلب حذفها عند انتهاء الغرض من جمعها، وفق القوانين المعمول بها."
                />
                
                <Section
                  title="التنازل"
                  content="قد تُنقل المعلومات ضمن عمليات الاستحواذ أو البيع، وستظل محمية وفق سياسة الخصوصية هذه."
                />
                
                <Section
                  title="المسؤولية"
                  content="أنت مسؤول عن فهم سياسة الخصوصية والموافقة عليها. باستخدامك لتطبيق Wasata AI، توافق على حماية الشركة من أي مطالبات ناتجة عن استخدامك للخدمات."
                />
              </div>
            </div>

            {/* English Section - Left */}
            <div className="order-2 lg:order-1 bg-card rounded-2xl shadow-lg p-6 md:p-8 border" dir="ltr">
              <div className="space-y-6 text-left">
                <Section
                  title="Privacy Policy"
                  content="Wasata AI and its affiliated companies and services value user data privacy. This policy explains how we collect, use, and share information when you use our app."
                />
                
                <Section
                  title="Information Collection"
                  content="We collect personal information such as your name, phone number, email, payment details, and activity within the app to provide a personalized and efficient service."
                />
                
                <Section
                  title="Use of Information"
                  content="We use your information to provide Wasata AI services, enhance your experience, communicate with you when needed, and offer relevant real estate opportunities and recommendations."
                />
                
                <Section
                  title="Information Disclosure"
                  content="We may share your data with service partners, real estate agents, or service providers linked to the app to perform requested services, in compliance with local laws."
                />
                
                <Section
                  title="Security"
                  content="We take all reasonable measures to protect your data from unauthorized access, use, or alteration."
                />
                
                <Section
                  title="User Rights"
                  content="You have the right to access, correct, or request deletion of your data when it is no longer needed, in accordance with applicable laws."
                />
                
                <Section
                  title="Transfer"
                  content="Information may be transferred during acquisition or sale processes and will remain protected under this privacy policy."
                />
                
                <Section
                  title="Responsibility"
                  content="You are responsible for understanding and agreeing to this privacy policy. By using Wasata AI, you agree to hold the company harmless from any claims arising from your use of the services."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-10 text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} Wasata AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div className="border-b border-border/50 pb-4 last:border-0">
    <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{content}</p>
  </div>
);

export default PrivacyPolicyPage;
