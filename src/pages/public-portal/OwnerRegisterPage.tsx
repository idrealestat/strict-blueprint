import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneVerificationField from "@/components/PhoneVerificationField";

const phoneRe = /^(05|5|\+?966)\d{8,9}$/;
const schema = z.object({
  phone: z.string().regex(phoneRe, "رقم جوال غير صحيح"),
  email: z.string().email("بريد غير صالح").optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور 8 حروف على الأقل"),
  passwordConfirm: z.string(),
  full_name: z.string().min(3, "الاسم الرباعي مطلوب"),
  national_id: z.string().regex(/^\d{10}$/, "الهوية 10 أرقام"),
  date_of_birth: z.string().min(1, "تاريخ الميلاد مطلوب"),
  city: z.string().min(2),
  neighborhood: z.string().min(2),
  agree: z.boolean().refine((v) => v, "يجب الموافقة على الشروط"),
}).refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "كلمتا المرور غير متطابقتين" });

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [form, setForm] = useState({
    phone: "", email: "", password: "", passwordConfirm: "",
    full_name: "", national_id: "", date_of_birth: "",
    city: "", neighborhood: "", agree: false,
  });
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill from sessionStorage if user came from "هنا وسيطك"
  useEffect(() => {
    const raw = sessionStorage.getItem("huna_waseetak_pending");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setPendingSubmission(p);
        setForm((f) => ({
          ...f,
          full_name: p.data?.ownerName || f.full_name,
          phone: (p.data?.ownerPhone || "").replace(/\D/g, "") || f.phone,
          city: p.data?.city || f.city,
          neighborhood: p.data?.district || f.neighborhood,
        }));
      } catch {}
    }
  }, []);

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\s|\+/g, "");
    if (clean.startsWith("966")) return "+" + clean;
    if (clean.startsWith("05")) return "+966" + clean.slice(1);
    if (clean.startsWith("5")) return "+966" + clean;
    return "+" + clean;
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "بيانات غير صحيحة");
      return;
    }
    if (!phoneVerified) {
      toast.error("يرجى التحقق من رقم الجوال أولاً");
      return;
    }
    setLoading(true);
    try {
      const phoneFmt = normalizePhone(form.phone);
      const phoneDigits = phoneFmt.replace(/\D/g, "");
      const email = form.email?.trim() || `${phoneDigits}@owners.wasataai.com`;
      const redirectUrl = `${window.location.origin}${redirect}`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: form.full_name, phone: phoneFmt } },
      });
      if (authErr) {
        const msg = (authErr.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          toast.error("هذا البريد/الجوال مسجّل مسبقًا. سجّل الدخول بدلاً من ذلك.");
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
          return;
        }
        throw authErr;
      }
      const userId = authData.user?.id;

      if (!authData.session) {
        await supabase.auth.signInWithPassword({ email, password: form.password });
      }

      if (userId) {
        await supabase.from("owner_profiles").insert({
          user_id: userId,
          full_name: form.full_name,
          national_id: form.national_id,
          date_of_birth: form.date_of_birth,
          phone: phoneFmt,
          email: form.email || null,
          city: form.city,
          neighborhood: form.neighborhood,
        });

        // Save the pending submission as draft if any
        if (pendingSubmission) {
          try {
            await supabase.from("owner_submissions").insert({
              owner_user_id: userId,
              submission_type: pendingSubmission.kind,
              purpose: pendingSubmission.purpose,
              status: "draft",
              source: "direct",
              city: pendingSubmission.data?.city || form.city,
              district: pendingSubmission.data?.district || form.neighborhood,
              data: pendingSubmission.data || {},
            }).select("id").single();
            sessionStorage.removeItem("huna_waseetak_pending");
            sessionStorage.setItem("owner_post_register", "1");
            toast.success("تم إنشاء حسابك وحفظ مسودة طلبك. اختر باقتك للمتابعة.");
            navigate("/choose-plan", { replace: true });
            return;
          } catch (err) {
            console.warn("Failed to save pending submission", err);
          }
        }
      }

      toast.success("تم إنشاء حسابك بنجاح!");
      navigate(redirect, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo py-8 px-4">
      <Helmet><title>إنشاء حساب مالك عقار | وساطة AI</title></Helmet>
      <div className="max-w-xl mx-auto bg-card rounded-2xl border p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#01411C]">إنشاء حساب مالك عقار</h1>
          <p className="text-sm text-muted-foreground mt-1">
            لديك حساب؟ <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#D4AF37] font-bold">سجّل الدخول</Link>
          </p>
        </div>

        <div className="space-y-4">
            <PhoneVerificationField
              phone={form.phone}
              onPhoneChange={(v) => update("phone", v)}
              onVerified={setPhoneVerified}
              label="رقم الجوال *"
            />
            <div><Label>البريد الإلكتروني (اختياري)</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} dir="ltr" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كلمة المرور</Label>
                <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} /></div>
              <div><Label>تأكيدها</Label>
                <Input type="password" value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} /></div>
            </div>
            <div><Label>الاسم الرباعي</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الهوية</Label>
                <Input value={form.national_id} onChange={(e) => update("national_id", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>
              <div><Label>تاريخ الميلاد</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>المدينة</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
              <div><Label>الحي</Label>
                <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></div>
            </div>
            <label className="flex gap-2 items-start text-sm">
              <input type="checkbox" checked={form.agree} onChange={(e) => update("agree", e.target.checked)} />
              <span>أوافق على <Link to="/terms" className="text-[#D4AF37]">الشروط</Link> و<Link to="/privacy" className="text-[#D4AF37]">سياسة الخصوصية</Link></span>
            </label>
            <Button onClick={submit} disabled={loading || !phoneVerified} className="w-full bg-[#01411C] hover:bg-[#065f41]">
              {loading ? "..." : "إنشاء الحساب"}
            </Button>
          </div>
      </div>
    </div>
  );
}