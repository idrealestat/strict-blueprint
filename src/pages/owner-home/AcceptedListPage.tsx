import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PURPOSE_LABEL: Record<string, string> = { sale: "بيع", rent: "تأجير", buy: "شراء", lease: "استئجار" };
const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending_acceptance: { text: "بانتظار الوسطاء", cls: "bg-blue-100 text-blue-800" },
  broker_assigned: { text: "تم اختيار وسيط", cls: "bg-emerald-100 text-emerald-800" },
  completed: { text: "مكتمل", cls: "bg-green-100 text-green-800" },
};

export default function AcceptedListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login?redirect=/owner/accepted", { replace: true }); return; }
      const { data } = await supabase
        .from("owner_submissions")
        .select("id, submission_type, purpose, status, city, district, created_at, data, assigned_broker_slug")
        .eq("owner_user_id", user.id)
        .in("status", ["pending_acceptance", "broker_assigned", "completed"])
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>المرسلة والمقبولة | وساطة AI</title></Helmet>
      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/owner/home" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold">العروض والطلبات المقبولة</h1>
          <span />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? <p className="text-center">جاري التحميل...</p>
          : rows.length === 0 ? <div className="text-center py-12 text-muted-foreground">لا يوجد لديك إرسالات بعد.</div>
          : <div className="space-y-3">
              {rows.map((r) => {
                const st = STATUS_LABEL[r.status] || { text: r.status, cls: "bg-muted" };
                return (
                  <Link key={r.id} to={`/owner/submission/${r.id}/proposals`} className="block bg-card border rounded-2xl p-4 hover:shadow-md">
                    <div className="flex justify-between mb-2">
                      <span className="bg-[#D4AF37]/20 text-[#01411C] font-bold px-2 py-1 rounded text-sm">
                        {r.submission_type === "offer" ? "عرض" : "طلب"} {PURPOSE_LABEL[r.purpose]}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${st.cls}`}>{st.text}</span>
                    </div>
                    <p className="text-sm">{r.data?.propertyType || "—"} • {r.city} • {r.district}</p>
                    {r.assigned_broker_slug && (
                      <p className="text-xs text-emerald-700 mt-1">الوسيط: {r.assigned_broker_slug}</p>
                    )}
                  </Link>
                );
              })}
            </div>}
      </main>
    </div>
  );
}