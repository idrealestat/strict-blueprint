import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PURPOSE_LABEL: Record<string, string> = {
  sale: "بيع", rent: "تأجير", buy: "شراء", lease: "استئجار",
};

export default function SubmissionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(`/login?redirect=/owner/submission/${id}/review`, { replace: true }); return; }
      const { data, error } = await supabase
        .from("owner_submissions").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("لم يتم العثور على السجل"); navigate("/owner/submissions"); return; }
      setRow(data);
      setLoading(false);
    })();
  }, [id, navigate]);

  const confirmSend = async () => {
    if (!row) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("owner_submissions")
        .update({ status: "pending_acceptance" })
        .eq("id", row.id);
      if (error) throw error;
      toast.success(`تم! ${row.submission_type === "offer" ? "عرضك" : "طلبك"} يُرسل الآن إلى وسطاء ${row.city || "مدينتك"}`);
      navigate("/owner/accepted");
    } catch (e: any) {
      toast.error(e.message || "فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  const d = row.data || {};
  const isFinal = ["pending_acceptance", "broker_assigned", "completed"].includes(row.status);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>مراجعة الإرسال | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/owner/submissions" className="text-[#D4AF37] font-bold flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
          <h1 className="font-bold">مراجعة قبل الإرسال</h1>
          <span />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37] rounded-2xl p-4 text-center">
          <p className="font-bold text-[#01411C]">
            {row.submission_type === "offer" ? "عرض" : "طلب"} {PURPOSE_LABEL[row.purpose]} — {d.propertyType}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            راجع البيانات بعناية ثم اضغط "تأكيد الإرسال"
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <Field label="الاسم" value={d.ownerName} />
          <Field label="رقم الجوال" value={d.ownerPhone} />
          <Field label="نوع العقار" value={d.propertyType} />
          <Field label="المدينة" value={row.city} />
          <Field label="الحي" value={row.district} />
          <Field label="السعر" value={d.price ? `${d.price} ريال` : "—"} />
          <Field label="المساحة" value={d.area ? `${d.area} م²` : "—"} />
          <Field label="الغرف" value={d.bedrooms} />
          <Field label="دورات المياه" value={d.bathrooms} />
          {d.description && <Field label="الوصف" value={d.description} />}
        </div>

        {!isFinal ? (
          <Button
            onClick={confirmSend}
            disabled={submitting}
            className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-6 text-lg"
          >
            <CheckCircle className="w-5 h-5 ml-2" />
            {submitting ? "..." : "تأكيد الإرسال إلى وسطاء المدينة"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-center font-bold">
              تم الإرسال — في انتظار رد الوسطاء
            </div>
            <Button
              onClick={() => navigate(`/owner/submission/${row.id}/proposals`)}
              className="w-full bg-[#D4AF37] hover:bg-[#b8951f] text-[#01411C] py-5 font-bold"
            >
              عرض ردود الوسطاء
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-muted pb-2 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-bold">{value || "—"}</span>
    </div>
  );
}