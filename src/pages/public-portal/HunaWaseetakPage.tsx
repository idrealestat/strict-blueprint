import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LogIn } from "lucide-react";
import DirectSubmissionForm from "./DirectSubmissionForm";

export default function HunaWaseetakPage() {
  const [tab, setTab] = useState<"offers" | "requests">("offers");

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>هنا وسيطك | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-5 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-[#D4AF37] font-bold">← الرئيسية</Link>
          <h1 className="text-xl md:text-2xl font-bold">هنا وسيطك</h1>
          <Link
            to="/login?redirect=/owner/home"
            className="flex items-center gap-1 bg-[#D4AF37] text-[#01411C] px-3 py-2 rounded-lg font-bold text-sm"
          >
            <LogIn className="w-4 h-4" />
            تسجيل دخول
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-[#01411C] mb-2">
          أرسل عرضك أو طلبك للوسطاء
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          سجّل وسيطك المفضّل أو دع وسطاء مدينتك يتنافسون لخدمتك
        </p>

        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setTab("offers")}
            className={`flex-1 py-3 rounded-md font-bold transition ${
              tab === "offers" ? "bg-[#01411C] text-white" : "text-foreground"
            }`}
          >
            العروض
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex-1 py-3 rounded-md font-bold transition ${
              tab === "requests" ? "bg-[#01411C] text-white" : "text-foreground"
            }`}
          >
            الطلبات
          </button>
        </div>

        {tab === "offers" ? (
          <DirectSubmissionForm kind="offer" defaultPurpose="sale" />
        ) : (
          <DirectSubmissionForm kind="request" defaultPurpose="buy" />
        )}
      </div>
    </div>
  );
}