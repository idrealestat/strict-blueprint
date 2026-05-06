import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BrokerCard {
  user_id: string;
  slug: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  submissionsCount: number;
}

export default function OwnerClientsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<BrokerCard[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login?redirect=/owner/clients", { replace: true }); return; }

      const { data: subs } = await supabase
        .from("owner_submissions")
        .select("id, assigned_broker_slug")
        .eq("owner_user_id", user.id)
        .not("assigned_broker_slug", "is", null);

      const ids = (subs || []).map((s: any) => s.id);
      const slugCounts = new Map<string, number>();
      (subs || []).forEach((s: any) => {
        if (s.assigned_broker_slug) {
          slugCounts.set(s.assigned_broker_slug, (slugCounts.get(s.assigned_broker_slug) || 0) + 1);
        }
      });

      let proposalSlugs: string[] = [];
      if (ids.length) {
        const { data: props } = await supabase
          .from("owner_broker_proposals")
          .select("broker_slug")
          .in("submission_id", ids);
        proposalSlugs = ((props || []) as any[]).map((p) => p.broker_slug).filter(Boolean);
      }
      proposalSlugs.forEach((sl) => {
        if (!slugCounts.has(sl)) slugCounts.set(sl, 0);
      });

      const slugs = Array.from(slugCounts.keys());
      let cards: BrokerCard[] = [];
      if (slugs.length) {
        const { data: bcs } = await supabase
          .from("business_cards")
          .select("user_id, slug, phone, email, data")
          .in("slug", slugs);
        cards = ((bcs || []) as any[]).map((b) => ({
          user_id: b.user_id,
          slug: b.slug,
          name: b.data?.full_name || b.data?.name || b.slug || "وسيط",
          phone: b.phone,
          email: b.email,
          submissionsCount: slugCounts.get(b.slug) || 0,
        }));
      }
      setBrokers(cards);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>إدارة العملاء | وساطة AI</title></Helmet>
      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/owner/home" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold">إدارة العملاء</h1>
          <span />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center">جاري التحميل...</p>
        ) : brokers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا يوجد وسطاء مرتبطين بعد.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {brokers.map((b) => (
              <div key={b.slug || b.user_id} className="bg-card border-2 border-[#D4AF37]/40 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-[#01411C]/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#01411C]" />
                  </div>
                  <div>
                    <p className="font-bold">{b.name}</p>
                    {b.slug && <p className="text-xs text-muted-foreground">@{b.slug}</p>}
                  </div>
                </div>
                {b.phone && <p className="text-sm">📞 {b.phone}</p>}
                {b.email && <p className="text-sm">✉️ {b.email}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {b.submissionsCount} إرسال مرتبط
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}