import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2 } from "lucide-react";

export default function OfferSuccessPage() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background font-cairo px-4">
      <Helmet><title>تم نشر عرضك | وساطة AI</title></Helmet>
      <div className="max-w-md text-center bg-card border rounded-2xl p-10 shadow-lg">
        <CheckCircle2 className="w-20 h-20 mx-auto text-[#D4AF37] mb-4" />
        <h1 className="text-2xl font-bold mb-3">تم نشر عرضك بنجاح!</h1>
        <p className="text-muted-foreground mb-6">
          عرضك قيد المراجعة. سيتم إرساله للوسطاء المناسبين في منطقتك، وسيصلك تنبيه عند قبول وسيط لعرضك.
        </p>
        <Link to="/" className="inline-block bg-[#01411C] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#065f41] transition">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}