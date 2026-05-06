import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bell, Menu, FileText, Inbox, Users, TrendingUp, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import OwnerRightSlider from "@/components/owner/OwnerRightSlider";

type Tier = "basic" | "developed";

export default function OwnerHomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier>("basic");
  const [loaded, setLoaded] = useState(false);
  const [sliderOpen, setSliderOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login?redirect=/owner/home", { replace: true }); return; }
      const { data: prof } = await supabase
        .from("owner_profiles")
        .select("full_name, plan_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof?.full_name) setName(prof.full_name);
      if (prof?.plan_tier === "developed") setTier("developed");
      setLoaded(true);
    })();
  }, [navigate]);

  const upgrade = () => navigate("/app/choose-plan");

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>لوحة المالك | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button onClick={() => setSliderOpen(true)} className="text-white" aria-label="القائمة">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-xl font-bold flex-1 text-center truncate">
            مرحبًا{name ? `، ${name}` : ""}
          </h1>
          <div className="flex items-center gap-2">
            {tier === "basic" && (
              <button
                onClick={upgrade}
                className="bg-[#D4AF37] text-[#01411C] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Crown className="w-3 h-3" /> ترقية الباقة
              </button>
            )}
            <button className="text-white" aria-label="الإشعارات">
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!loaded ? (
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        ) : tier === "basic" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/owner/submissions"
              className="block bg-card border-2 border-[#D4AF37] rounded-2xl p-6 hover:shadow-xl transition"
            >
              <FileText className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">إرسال العروض والطلبات</h3>
              <p className="text-sm text-muted-foreground">أنشئ عرضًا أو طلبًا جديدًا أو راجع المسودات</p>
            </Link>
            <Link
              to="/owner/accepted"
              className="block bg-card border-2 border-muted rounded-2xl p-6 hover:shadow-xl transition"
            >
              <Inbox className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">العروض والطلبات المقبولة</h3>
              <p className="text-sm text-muted-foreground">تابع حالة طلباتك والوسطاء المرتبطين بها</p>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/owner/clients" className="block bg-card border-2 border-[#D4AF37] rounded-2xl p-6 hover:shadow-xl transition">
              <Users className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">إدارة العملاء</h3>
              <p className="text-sm text-muted-foreground">بطاقات الوسطاء المرتبطين بك ومعلوماتهم</p>
            </Link>
            <Link to="/owner/submissions" className="block bg-card border-2 border-[#D4AF37] rounded-2xl p-6 hover:shadow-xl transition">
              <FileText className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">إرسال العروض والطلبات</h3>
              <p className="text-sm text-muted-foreground">أنشئ عرضًا أو طلبًا جديدًا أو راجع المسودات</p>
            </Link>
            <Link to="/owner/accepted" className="block bg-card border-2 border-muted rounded-2xl p-6 hover:shadow-xl transition">
              <Inbox className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">العروض والطلبات المقبولة</h3>
              <p className="text-sm text-muted-foreground">تابع حالة طلباتك والوسطاء المرتبطين بها</p>
            </Link>
            <Link to="/owner/performance" className="block bg-card border-2 border-muted rounded-2xl p-6 hover:shadow-xl transition">
              <TrendingUp className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">أداء عقاراتي وطلباتي</h3>
              <p className="text-sm text-muted-foreground">إحصائيات المشاهدات والوسطاء المهتمين</p>
            </Link>
          </div>
        )}
      </main>

      <OwnerRightSlider open={sliderOpen} onClose={() => setSliderOpen(false)} tier={tier} />
    </div>
  );
}