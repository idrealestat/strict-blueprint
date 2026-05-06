import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Kind = "offer" | "request";
type Purpose = "sale" | "rent" | "buy" | "lease";

interface Props {
  kind: Kind;
  defaultPurpose: Purpose;
}

const propertyTypes = ["شقة", "فيلا", "عمارة", "أرض", "دور", "دوبلكس", "استوديو", "محل تجاري", "مكتب", "مستودع", "استراحة"];
const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها", "الطائف"];

const PURPOSE_LABEL: Record<Purpose, string> = {
  sale: "بيع", rent: "تأجير", buy: "شراء", lease: "استئجار",
};

const STORAGE_KEY = "huna_waseetak_pending";

export default function DirectSubmissionForm({ kind, defaultPurpose }: Props) {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState<Purpose>(defaultPurpose);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: "",
    propertyType: "",
    city: "",
    district: "",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    description: "",
  });

  // Restore form if user came back from registration
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.kind === kind) {
          setForm({ ...form, ...parsed.data });
          if (parsed.purpose) setPurpose(parsed.purpose);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const validate = () => {
    if (!form.ownerName.trim()) return "الاسم مطلوب";
    if (!form.ownerPhone.trim()) return "رقم الجوال مطلوب";
    if (!form.propertyType) return "نوع العقار مطلوب";
    if (!form.city) return "المدينة مطلوبة";
    if (!form.district.trim()) return "الحي مطلوب";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { kind, purpose, data: form };

      if (!user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        toast.success("أحسنت! لإيجاد وسيطك يتطلب التسجيل");
        navigate(`/register?redirect=${encodeURIComponent("/owner/home?from=submission")}`);
        return;
      }

      // Logged-in: save directly as draft
      const { data: row, error } = await supabase.from("owner_submissions").insert({
        owner_user_id: user.id,
        submission_type: kind,
        purpose,
        status: "draft",
        source: "direct",
        city: form.city,
        district: form.district,
        data: form,
      }).select("id").single();
      if (error) throw error;
      sessionStorage.removeItem(STORAGE_KEY);
      toast.success("تم حفظ المسودة. راجعها ثم أكّد الإرسال.");
      navigate(`/owner/submission/${row.id}/review`);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions: Purpose[] = kind === "offer" ? ["sale", "rent"] : ["buy", "lease"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {purposeOptions.map((p) => (
          <button
            key={p}
            onClick={() => setPurpose(p)}
            className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${
              purpose === p
                ? "bg-[#01411C] text-white border-[#01411C]"
                : "bg-card text-foreground border-muted"
            }`}
          >
            {PURPOSE_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border-2 border-[#D4AF37]/30 rounded-2xl p-5">
        <div><Label>الاسم</Label>
          <Input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} /></div>
        <div><Label>رقم الجوال</Label>
          <Input value={form.ownerPhone} onChange={(e) => update("ownerPhone", e.target.value.replace(/\D/g, ""))} dir="ltr" placeholder="9665xxxxxxxx" /></div>

        <div><Label>نوع العقار</Label>
          <Select value={form.propertyType} onValueChange={(v) => update("propertyType", v)}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>
              {propertyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>المدينة</Label>
          <Select value={form.city} onValueChange={(v) => update("city", v)}>
            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
            <SelectContent>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div><Label>الحي</Label>
          <Input value={form.district} onChange={(e) => update("district", e.target.value)} /></div>
        <div><Label>السعر التقريبي (ريال)</Label>
          <Input value={form.price} onChange={(e) => update("price", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>

        <div><Label>المساحة (م²)</Label>
          <Input value={form.area} onChange={(e) => update("area", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>غرف</Label>
            <Input value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>
          <div><Label>دورات مياه</Label>
            <Input value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>
        </div>

        <div className="md:col-span-2"><Label>وصف مختصر</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#01411C] hover:bg-[#065f41] text-white text-lg py-6"
      >
        {loading ? "..." : `إرسال ${kind === "offer" ? "العرض" : "الطلب"}`}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        بإرسال هذا النموذج توافق على <a href="/terms" className="text-[#D4AF37]">الشروط</a> و
        <a href="/privacy" className="text-[#D4AF37]"> سياسة الخصوصية</a>.
      </p>
    </div>
  );
}