import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Inbox, Send, MapPin } from "lucide-react";

interface Submission {
  id: string;
  submission_type: string;
  purpose: string;
  city: string | null;
  district: string | null;
  data: any;
  created_at: string;
}

const PURPOSE_LABEL: Record<string, string> = { sale: "بيع", rent: "تأجير", buy: "شراء", lease: "استئجار" };

export default function BrokerOwnerInboxPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [brokerSlug, setBrokerSlug] = useState<string | null>(null);
  const [proposed, setProposed] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<{ commission: string; services: string }>({ commission: "", services: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("سجّل الدخول أولاً"); return; }
      setUser(user);

      const { data: card } = await supabase
        .from("business_cards").select("slug, data")
        .eq("user_id", user.id).maybeSingle();
      const myCity = (card?.data as any)?.city || (card?.data as any)?.office_city;
      setBrokerSlug(card?.slug || null);

      let q = supabase
        .from("owner_submissions")
        .select("id, submission_type, purpose, city, district, data, created_at")
        .eq("status", "pending_acceptance")
        .order("created_at", { ascending: false });
      if (myCity) q = q.eq("city", myCity);
      const { data } = await q;
      setRows((data as Submission[]) || []);

      // العروض التي قدّمتها سابقاً
      const { data: mine } = await supabase
        .from("owner_broker_proposals")
        .select("submission_id")
        .eq("broker_user_id", user.id);
      setProposed(new Set((mine || []).map((m: any) => m.submission_id)));
      setLoading(false);
    })();
  }, []);

  const sendProposal = async (s: Submission) => {
    if (!user) return;
    if (!brokerSlug) { toast.error("بطاقتك غير منشورة بعد"); return; }
    setSending(true);
    try {
      const services = form.services.split("،").map((x) => x.trim()).filter(Boolean);
      const { error } = await supabase.from("owner_broker_proposals").insert({
        submission_id: s.id,
        broker_user_id: user.id,
        broker_slug: brokerSlug,
        commission_percent: form.commission ? Number(form.commission) : null,
        services,
        status: "pending",
      });
      if (error) throw error;
      toast.success("تم إرسال عرضك إلى المالك");
      setProposed(new Set([...proposed, s.id]));
      setOpenId(null);
      setForm({ commission: "", services: "" });
    } catch (e: any) {
      toast.error(e.message || "فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>طلبات الملاك | وساطة AI</title></Helmet>
      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Inbox className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="font-bold text-lg">طلبات الملاك في مدينتك</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد طلبات نشطة في مدينتك حالياً.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((s) => {
              const isOpen = openId === s.id;
              const already = proposed.has(s.id);
              return (
                <div key={s.id} className="bg-card border-2 border-[#D4AF37]/40 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30"
                  >
                    <div className="text-right">
                      <p className="font-bold">
                        {s.submission_type === "offer" ? "عرض" : "طلب"} {PURPOSE_LABEL[s.purpose]} — {s.data?.propertyType || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {s.city} • {s.district}
                      </p>
                    </div>
                    {already && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">
                        تم تقديم عرضك
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t p-4 space-y-3 bg-muted/20">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">المساحة:</span> {s.data?.area || "—"}</div>
                        <div><span className="text-muted-foreground">السعر:</span> {s.data?.price || "—"}</div>
                        <div><span className="text-muted-foreground">غرف:</span> {s.data?.bedrooms || "—"}</div>
                        <div><span className="text-muted-foreground">دورات مياه:</span> {s.data?.bathrooms || "—"}</div>
                      </div>
                      {s.data?.description && (
                        <p className="text-sm bg-card p-2 rounded">{s.data.description}</p>
                      )}

                      {!already && (
                        <div className="space-y-2 border-t pt-3">
                          <Label>نسبة العمولة (%)</Label>
                          <Input
                            type="number" min="0" max="10" step="0.1"
                            value={form.commission}
                            onChange={(e) => setForm({ ...form, commission: e.target.value })}
                            placeholder="مثال: 2.5"
                          />
                          <Label>الخدمات (افصل بـ ، )</Label>
                          <Textarea
                            rows={2}
                            value={form.services}
                            onChange={(e) => setForm({ ...form, services: e.target.value })}
                            placeholder="تسويق، تصوير، عقد، متابعة"
                          />
                          <Button
                            onClick={() => sendProposal(s)}
                            disabled={sending}
                            className="w-full bg-[#01411C] hover:bg-[#065f41] text-white"
                          >
                            <Send className="w-4 h-4 ml-2" />
                            {sending ? "..." : "إرسال عرضي للمالك"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}