import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, Key, ShoppingCart, Search } from "lucide-react";

export default function HunaWaseetakPage() {
  const [tab, setTab] = useState<"offers" | "requests">("offers");

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>هنا وسيطك | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-[#D4AF37] font-bold">← الرئيسية</Link>
          <h1 className="text-xl font-bold">هنا وسيطك</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setTab("offers")}
            className={`flex-1 py-3 rounded-md font-bold transition ${tab === "offers" ? "bg-[#01411C] text-white" : "text-foreground"}`}
          >
            العروض
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex-1 py-3 rounded-md font-bold transition ${tab === "requests" ? "bg-[#01411C] text-white" : "text-foreground"}`}
          >
            الطلبات
          </button>
        </div>

        {tab === "offers" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/huna-waseetak/offer-sale" className="bg-card border-2 border-[#D4AF37] rounded-2xl p-8 text-center hover:shadow-xl transition">
              <Home className="w-12 h-12 mx-auto mb-3 text-[#01411C]" />
              <h3 className="text-xl font-bold mb-2">عرض بيع</h3>
              <p className="text-sm text-muted-foreground">اعرض عقارك للبيع للوسطاء</p>
            </Link>
            <Link to="/huna-waseetak/offer-rent" className="bg-card border-2 border-muted rounded-2xl p-8 text-center hover:shadow-xl transition opacity-70">
              <Key className="w-12 h-12 mx-auto mb-3 text-[#01411C]" />
              <h3 className="text-xl font-bold mb-2">عرض تأجير</h3>
              <p className="text-sm text-muted-foreground">قريبًا</p>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border-2 border-muted rounded-2xl p-8 text-center opacity-70">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-[#01411C]" />
              <h3 className="text-xl font-bold mb-2">طلب شراء</h3>
              <p className="text-sm text-muted-foreground">قريبًا</p>
            </div>
            <div className="bg-card border-2 border-muted rounded-2xl p-8 text-center opacity-70">
              <Search className="w-12 h-12 mx-auto mb-3 text-[#01411C]" />
              <h3 className="text-xl font-bold mb-2">طلب استئجار</h3>
              <p className="text-sm text-muted-foreground">قريبًا</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}