import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ChevronDown, ChevronUp, CheckCircle, Phone, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitToBrokerCRM } from "@/utils/submitToBrokerCRM";

interface Proposal {
  id: string;
  broker_user_id: string;
  broker_slug: string | null;
  services: any[];
  commission_percent: number | null;
  status: string;
  created_at: string;
  card?: {
    name?: string;
    office_name?: string;
    phone?: string;
    fal_license_number?: string;
    avatar_url?: string;
  };
}

export default function SubmissionProposalsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(`/login?redirect=/owner/submission/${id}/proposals`, { replace: true }); return; }

      const { data: sub } = await supabase
        .from("owner_submissions").select("*").eq("id", id).maybeSingle();
      if (!sub) { toast.error("لم يتم العثور على الإرسال"); navigate("/owner/accepted"); return; }
      setSubmission(sub);

      const { data: props } = await supabase
        .from("owner_broker_proposals")
        .select("*")
        .eq("submission_id", id)
        .order("created_at", { ascending: true });

      // اجلب بطاقات الوسطاء المرتبطة
      const enriched: Proposal[] = [];
      for (const p of (props as any[]) || []) {
        const { data: card } = await supabase
          .from("business_cards")
          .select("data, phone, fal_license_number")
          .eq("user_id", p.broker_user_id)
          .maybeSingle();
        const cd: any = card?.data || {};
        enriched.push({
          ...p,
          card: {
            name: cd.name || cd.full_name,
            office_name: cd.office_name || cd.company_name,
            phone: card?.phone || cd.phone,
            fal_license_number: card?.fal_license_number,
            avatar_url: cd.avatar_url || cd.photo_url,
          },
        });
      }
      setProposals(enriched);
      setLoading(false);
    })();
  }, [id, navigate]);

  const acceptProposal = async (p: Proposal) => {
    if (!submission) return;
    if (!p.broker_slug) { toast.error("بيانات الوسيط ناقصة"); return; }
    setAcceptingId(p.id);
    try {
      await submitToBrokerCRM({
        submissionId: submission.id,
        brokerSlug: p.broker_slug,
        brokerUserId: p.broker_user_id,
      });
      // علِّم العرض المقبول، ورفض البقية
      await supabase.from("owner_broker_proposals")
        .update({ status: "accepted" }).eq("id", p.id);
      await supabase.from("owner_broker_proposals")
        .update({ status: "rejected" })
        .eq("submission_id", submission.id)
        .neq("id", p.id);
      toast.success("تم اختيار الوسيط وإرسال البيانات إليه");
      navigate("/owner/accepted");
    } catch (e: any) {
      toast.error(e.message || "فشل اختيار الوسيط");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center font-cairo">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>عروض الوسطاء | وساطة AI</title></Helmet>
      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/owner/accepted" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold">عروض الوسطاء</h1>
          <span />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37] rounded-2xl p-4 text-center">
          <p className="font-bold text-[#01411C]">
            {proposals.length === 0
              ? "لا توجد عروض من الوسطاء بعد"
              : `${proposals.length} وسيط أبدى اهتمامه`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">اضغط على المستطيل لرؤية التفاصيل ثم اختر وسيطك</p>
        </div>

        {proposals.map((p) => {
          const isOpen = openId === p.id;
          const isAccepted = p.status === "accepted";
          return (
            <div key={p.id} className={`bg-card border-2 rounded-2xl overflow-hidden ${isAccepted ? "border-emerald-500" : "border-[#D4AF37]/40"}`}>
              <button
                onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {p.card?.avatar_url ? (
                    <img src={p.card.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#01411C] text-white flex items-center justify-center font-bold">
                      {(p.card?.name || "؟").charAt(0)}
                    </div>
                  )}
                  <div className="text-right">
                    <p className="font-bold">{p.card?.name || "وسيط"}</p>
                    <p className="text-xs text-muted-foreground">{p.card?.office_name || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.commission_percent != null && (
                    <span className="bg-[#D4AF37]/20 text-[#01411C] text-xs font-bold px-2 py-1 rounded">
                      عمولة {p.commission_percent}%
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-3 bg-muted/20">
                  {p.card?.fal_license_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span>ترخيص فال: {p.card.fal_license_number}</span>
                    </div>
                  )}
                  {p.card?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-[#01411C]" />
                      <span dir="ltr">{p.card.phone}</span>
                    </div>
                  )}
                  {Array.isArray(p.services) && p.services.length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-1">الخدمات المعروضة:</p>
                      <ul className="list-disc pr-5 text-sm space-y-1">
                        {p.services.map((s: any, i: number) => (
                          <li key={i}>{typeof s === "string" ? s : s?.name || JSON.stringify(s)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.broker_slug && (
                    <Link
                      to={`/${p.broker_slug}`}
                      target="_blank"
                      className="text-xs text-[#01411C] underline block"
                    >
                      عرض ملف الوسيط الكامل
                    </Link>
                  )}

                  {isAccepted ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-center font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> هذا الوسيط هو وسيطك المختار
                    </div>
                  ) : (
                    <Button
                      onClick={() => acceptProposal(p)}
                      disabled={acceptingId === p.id || submission?.status === "broker_assigned"}
                      className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-5"
                    >
                      {acceptingId === p.id ? "..." : "اختيار هذا الوسيط"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}