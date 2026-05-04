import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function SearchPlaceholderPage() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background font-cairo px-4">
      <Helmet><title>ابحث عن عقار | وساطة AI</title></Helmet>
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">ابحث عن عقار</h1>
        <p className="text-muted-foreground mb-6">هذه الميزة قيد التطوير. ترقّبنا قريبًا.</p>
        <Link to="/" className="text-[#D4AF37] font-bold">← العودة للرئيسية</Link>
      </div>
    </div>
  );
}