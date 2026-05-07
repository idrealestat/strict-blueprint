import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PublicOfferForm from "@/pages/public-forms/PublicOfferForm";
import PublicRequestForm from "@/pages/public-forms/PublicRequestForm";

interface Row {
  id: string;
  submission_type: string;
  purpose: string;
  status: string;
  city: string | null;
  district: string | null;
  created_at: string;
  data: any;
}

const PURPOSE_LABEL: Record<string, string> = {
  sale: "بيع", rent: "تأجير", buy: "شراء", lease: "استئجار",
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  draft: { text: "مسودة", cls: "bg-amber-100 text-amber-800" },
  saved: { text: "محفوظ", cls: "bg-amber-100 text-amber-800" },
  pending_acceptance: { text: "بانتظار الوسطاء", cls: "bg-blue-100 text-blue-800" },
  broker_assigned: { text: "تم اختيار وسيط", cls: "bg-emerald-100 text-emerald-800" },
  completed: { text: "مكتمل", cls: "bg-green-100 text-green-800" },
};

export default function SubmissionsListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"offer" | "request">("offer");
  const [userId, setUserId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login?redirect=/owner/submissions", { replace: true }); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("owner_submissions")
        .select("id, submission_type, purpose, status, city, district, created_at, data")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [navigate, reloadKey]);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>عروضي وطلباتي | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/owner/home" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold">إرسال العروض والطلبات</h1>
          <span />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setTab("offer")}
            className={`flex-1 py-3 rounded-md font-bold transition ${tab === "offer" ? "bg-[#01411C] text-white" : "text-foreground"}`}
          >
            ارسال عرض
          </button>
          <button
            onClick={() => setTab("request")}
            className={`flex-1 py-3 rounded-md font-bold transition ${tab === "request" ? "bg-[#01411C] text-white" : "text-foreground"}`}
          >
            ارسال طلب
          </button>
        </div>

        <div className="mb-8">
          {userId && (tab === "offer" ? (
            <PublicOfferForm ownerMode ownerUserId={userId} onOwnerSubmitted={() => setReloadKey(k => k + 1)} />
          ) : (
            <PublicRequestForm ownerMode ownerUserId={userId} onOwnerSubmitted={() => setReloadKey(k => k + 1)} />
          ))}
        </div>

        <h2 className="font-bold text-lg mb-3 text-[#01411C]">إرسالاتك السابقة</h2>

        {loading ? (
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا يوجد لديك عروض أو طلبات بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const st = STATUS_LABEL[r.status] || { text: r.status, cls: "bg-muted" };
              return (
                <Link
                  key={r.id}
                  to={`/owner/submission/${r.id}/review`}
                  className="block bg-card border rounded-2xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#D4AF37]/20 text-[#01411C] font-bold px-2 py-1 rounded text-sm">
                        {r.submission_type === "offer" ? "عرض" : "طلب"} {PURPOSE_LABEL[r.purpose]}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${st.cls}`}>{st.text}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <p className="text-sm">
                    {r.data?.propertyType || "—"} • {r.city} • {r.district}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}