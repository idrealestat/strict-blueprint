import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Trash2, Mail, Shield, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataDeletionPage = () => {
  const handleEmailClick = () => {
    window.location.href = 'mailto:wasata2035@gmail.com?subject=طلب حذف بيانات المستخدم - User Data Deletion Request';
  };

  return (
    <>
      <Helmet>
        <title>طلب حذف البيانات - Wasata AI | User Data Deletion Request</title>
        <meta name="description" content="اطلب حذف بياناتك من تطبيق Wasata AI. Request deletion of your data from Wasata AI application." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://wasata.wasataai.com/data-deletion" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C]">
        {/* Header */}
        <header className="py-8 px-4 text-center border-b border-[#D4AF37]/30">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              وساطة AI
            </h1>
            <p className="text-white/80 text-lg">Wasata AI - Smart Real Estate Platform</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Arabic Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-[#D4AF37]/30 mb-8">
            <CardHeader className="text-center border-b border-[#D4AF37]/20">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#D4AF37]/20 rounded-full">
                  <Trash2 className="w-10 h-10 text-[#D4AF37]" />
                </div>
              </div>
              <CardTitle className="text-2xl text-[#D4AF37]" dir="rtl">
                طلب حذف بيانات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6" dir="rtl">
              <div className="space-y-6 text-white/90">
                <p className="text-lg leading-relaxed">
                  نحن في وساطة AI نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. 
                  يمكنك طلب حذف جميع بياناتك المرتبطة بحسابك في أي وقت.
                </p>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    البيانات التي سيتم حذفها:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>معلومات الحساب الشخصية (الاسم، البريد الإلكتروني، رقم الجوال)</li>
                    <li>العروض العقارية المنشورة</li>
                    <li>بيانات العملاء والمواعيد</li>
                    <li>سجل المحادثات مع المساعد الذكي</li>
                    <li>بيانات الربط مع منصات التواصل الاجتماعي</li>
                    <li>جميع الملفات والصور المرفوعة</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    كيفية طلب الحذف:
                  </h3>
                  
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <p>أرسل بريداً إلكترونياً إلى العنوان أدناه مع ذكر "طلب حذف بيانات" في العنوان</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <p>قم بتضمين البريد الإلكتروني أو رقم الجوال المسجل في حسابك</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <p>سنتحقق من هويتك ونبدأ عملية الحذف</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Clock className="w-5 h-5" />
                  <p className="font-medium">سيتم حذف جميع بياناتك خلال 30 يوماً كحد أقصى</p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleEmailClick}
                    className="w-full bg-[#D4AF37] hover:bg-[#c9a431] text-[#01411C] font-bold py-6 text-lg"
                  >
                    <Mail className="w-5 h-5 ml-2" />
                    إرسال طلب الحذف عبر البريد الإلكتروني
                  </Button>
                  <p className="text-center mt-3 text-white/70">wasata2035@gmail.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* English Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-[#D4AF37]/30">
            <CardHeader className="text-center border-b border-[#D4AF37]/20">
              <CardTitle className="text-2xl text-[#D4AF37]">
                User Data Deletion Request
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6" dir="ltr">
              <div className="space-y-6 text-white/90">
                <p className="text-lg leading-relaxed">
                  At Wasata AI, we respect your privacy and are committed to protecting your personal data. 
                  You can request deletion of all data associated with your account at any time.
                </p>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Data that will be deleted:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personal account information (name, email, phone number)</li>
                    <li>Published real estate listings</li>
                    <li>Customer and appointment data</li>
                    <li>AI assistant conversation history</li>
                    <li>Social media platform connection data</li>
                    <li>All uploaded files and images</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    How to request deletion:
                  </h3>
                  
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <p>Send an email to the address below with "Data Deletion Request" in the subject</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <p>Include the email or phone number registered with your account</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-[#D4AF37] text-[#01411C] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <p>We will verify your identity and begin the deletion process</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Clock className="w-5 h-5" />
                  <p className="font-medium">All your data will be deleted within a maximum of 30 days</p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleEmailClick}
                    className="w-full bg-[#D4AF37] hover:bg-[#c9a431] text-[#01411C] font-bold py-6 text-lg"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Deletion Request via Email
                  </Button>
                  <p className="text-center mt-3 text-white/70">wasata2035@gmail.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-12 text-center text-white/60 space-y-2">
            <p>© 2025 Wasata AI. جميع الحقوق محفوظة | All Rights Reserved</p>
            <p>Kingdom of Saudi Arabia | المملكة العربية السعودية</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="/privacy" className="text-[#D4AF37] hover:underline">Privacy Policy</a>
              <span>|</span>
              <a href="/terms" className="text-[#D4AF37] hover:underline">Terms of Service</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DataDeletionPage;
