import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const phoneRe = /^9665\d{8}$/;
const schema = z.object({
  phone: z.string().regex(phoneRe, "رقم الجوال يجب أن يبدأ بـ 9665 ويتكون من 12 رقمًا"),
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
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
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

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "بيانات غير صحيحة");
      return;
    }
    setLoading(true);
    try {
      const phoneFmt = "+" + form.phone;
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone: phoneFmt, identifier: phoneFmt },
      });
      if (error || !data?.success) throw new Error(data?.error || "فشل إرسال الرمز");
      toast.success("تم إرسال رمز التحقق عبر واتساب");
      setStage("otp");
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndCreate = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const phoneFmt = "+" + form.phone;
      const { data: vData, error: vErr } = await supabase.functions.invoke("verify-otp", {
        body: { identifier: phoneFmt, code: otp, type: "phone" },
      });
      if (vErr || !vData?.success) throw new Error(vData?.error || "رمز التحقق غير صحيح");

      const email = form.email?.trim() || `${form.phone}@owners.wasataai.com`;
      const redirectUrl = `${window.location.origin}${redirect}`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: form.full_name, phone: phoneFmt } },
      });
      if (authErr) throw authErr;
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
            const { data: row } = await supabase.from("owner_submissions").insert({
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
            if (row?.id) {
              toast.success("تم إنشاء حسابك وحفظ مسودة طلبك");
              navigate(`/owner/submission/${row.id}/review`, { replace: true });
              return;
            }
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

        {stage === "form" ? (
          <div className="space-y-4">
            <div><Label>رقم الجوال (مثال: 966512345678)</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} dir="ltr" /></div>
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
            <Button onClick={submit} disabled={loading} className="w-full bg-[#01411C] hover:bg-[#065f41]">
              {loading ? "..." : "إرسال رمز التحقق"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p>أدخل الرمز المُرسَل إلى واتساب على الرقم {form.phone}</p>
            <div className="flex justify-center" dir="ltr">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={verifyAndCreate} disabled={loading || otp.length !== 6} className="w-full bg-[#D4AF37] text-[#01411C] hover:bg-[#c19f2c]">
              {loading ? "..." : "تأكيد وإنشاء الحساب"}
            </Button>
            <button onClick={() => setStage("form")} className="text-sm text-muted-foreground">تعديل البيانات</button>
          </div>
        )}
      </div>
    </div>
  );
}