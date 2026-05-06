import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Crown, Eye, Users, Phone, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PerformancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ submissions: 0, brokers: 0, accepted: 0, views: 0 });
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login?redirect=/owner/performance", { replace: true }); return; }

      const { data: subs } = await supabase
        .from("owner_submissions")
        .select("id, status, data, city, district, assigned_broker_slug, created_at")
        .eq("owner_user_id", user.id);

      const ids = (subs || []).map((s: any) => s.id);
      let proposalsCount = 0;
      if (ids.length) {
        const { count } = await supabase
          .from("owner_broker_proposals")
          .select("id", { count: "exact", head: true })
          .in("submission_id", ids);
        proposalsCount = count || 0;
      }

      // مشاهدات للعروض المرسلة لوسطاء (إن وجدت)
      let totalViews = 0;
      const slugs = (subs || []).map((s: any) => s.assigned_broker_slug).filter(Boolean);
      if (slugs.length) {
        const { count } = await supabase
          .from("offer_views_log")
          .select("id", { count: "exact", head: true });
        totalViews = count || 0;
      }

      setStats({
        submissions: subs?.length || 0,
        brokers: proposalsCount,
        accepted: (subs || []).filter((s: any) => s.status === "broker_assigned" || s.status === "completed").length,
        views: totalViews,
      });
      setItems(subs || []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>الأداء | وساطة AI</title></Helmet>
      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/owner/home" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-[#D4AF37]" /> الأداء (الباقة المطورة)</h1>
          <span />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? <p className="text-center">جاري التحميل...</p> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={TrendingUp} label="إجمالي الإرسالات" value={stats.submissions} />
              <Stat icon={Users} label="وسطاء أبدوا اهتمامًا" value={stats.brokers} />
              <Stat icon={Phone} label="تم اختيار وسيط" value={stats.accepted} />
              <Stat icon={Eye} label="مشاهدات الإعلان" value={stats.views} />
            </div>

            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-bold mb-3">تفاصيل عقاراتك</h3>
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">لا توجد بيانات بعد</p>
              ) : (
                <div className="space-y-2">
                  {items.map((s) => (
                    <Link key={s.id} to={`/owner/submission/${s.id}/proposals`}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50">
                      <span className="text-sm">{s.data?.propertyType || "عقار"} • {s.city}</span>
                      <span className="text-xs text-muted-foreground">{s.assigned_broker_slug || "—"}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border-2 border-[#D4AF37]/40 rounded-2xl p-4 text-center">
      <Icon className="w-6 h-6 text-[#01411C] mx-auto mb-2" />
      <p className="text-2xl font-bold text-[#01411C]">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}