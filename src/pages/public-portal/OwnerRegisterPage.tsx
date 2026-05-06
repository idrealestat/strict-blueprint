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
const baseSchema = z.object({
  phone: z.string().regex(phoneRe, "رقم جوال غير صحيح"),
  email: z.string().email("بريد غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 حروف على الأقل"),
  passwordConfirm: z.string(),
  full_name: z.string().min(3, "الاسم الرباعي مطلوب"),
  national_id: z.string().regex(/^\d{10}$/, "الهوية 10 أرقام"),
  date_of_birth: z.string().min(1, "تاريخ الميلاد مطلوب"),
  city: z.string().min(2),
  neighborhood: z.string().min(2),
  agree: z.boolean().refine((v) => v, "يجب الموافقة على الشروط"),
}).refine((d) => d.password === d.passwordConfirm, {
  path: ["passwordConfirm"],
  message: "كلمتا المرور غير متطابقتين",
});

type AccountCheck = {
  exists: boolean;
  user_id?: string;
  email?: string | null;
  has_owner_profile: boolean;
  has_business_card: boolean;
};

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/choose-plan";

  const [form, setForm] = useState({
    phone: "", email: "", password: "", passwordConfirm: "",
    full_name: "", national_id: "", date_of_birth: "",
    city: "", neighborhood: "", agree: false,
  });
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [accountCheck, setAccountCheck] = useState<AccountCheck | null>(null);
  const [existingPassword, setExistingPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  // عند التحقق من الجوال، نفحص إن كان للمستخدم حساب سابق
  const handlePhoneVerified = async (verified: boolean) => {
    setPhoneVerified(verified);
    if (!verified) { setAccountCheck(null); return; }
    try {
      const phoneFmt = normalizePhone(form.phone);
      const { data, error } = await supabase.functions.invoke("check-account-exists", {
        body: { phone: phoneFmt, email: form.email || undefined },
      });
      if (error) throw error;
      setAccountCheck(data as AccountCheck);
      if (data?.exists && data.email && !form.email) {
        setForm((f) => ({ ...f, email: data.email }));
      }
      if (data?.exists && data.has_owner_profile) {
        toast.info("لديك حساب مالك بالفعل. سجّل الدخول.");
      } else if (data?.exists && data.has_business_card) {
        toast.info("اكتشفنا أن لديك حسابًا كوسيط. أدخل كلمة مرورك لإضافة دور المالك.");
      }
    } catch (e: any) {
      console.warn("check-account-exists failed", e);
    }
  };

  const insertOwnerProfile = async (userId: string, phoneFmt: string) => {
    const { error } = await supabase.from("owner_profiles").insert({
      user_id: userId,
      full_name: form.full_name,
      national_id: form.national_id,
      date_of_birth: form.date_of_birth,
      phone: phoneFmt,
      email: form.email || null,
      city: form.city,
      neighborhood: form.neighborhood,
    });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;

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
        });
        sessionStorage.removeItem("huna_waseetak_pending");
      } catch (err) { console.warn("Failed to save pending submission", err); }
    }
    sessionStorage.setItem("owner_post_register", "1");
  };

  const submit = async () => {
    if (!phoneVerified) { toast.error("يرجى التحقق من رقم الجوال أولاً"); return; }
    const skipPwd = !!(accountCheck?.exists && accountCheck.has_business_card && !accountCheck.has_owner_profile);
    const schema = skipPwd
      ? baseSchema._def.schema.omit({ password: true, passwordConfirm: true } as any)
      : baseSchema;
    const parsed = (schema as any).safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "بيانات غير صحيحة");
      return;
    }

    setLoading(true);
    try {
      const phoneFmt = normalizePhone(form.phone);
      // أعد فحص الحساب الآن مع البريد المُدخل (قد يختلف)
      const { data: chk } = await supabase.functions.invoke("check-account-exists", {
        body: { phone: phoneFmt, email: form.email },
      });
      const check: AccountCheck = chk || { exists: false, has_owner_profile: false, has_business_card: false };

      // سيناريو: لديه owner_profile مسبقاً
      if (check.exists && check.has_owner_profile) {
        toast.error("لديك حساب مالك بالفعل. سجّل الدخول.");
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      let userId: string | null = null;

      if (check.exists && check.user_id) {
        // سيناريو ب: حساب وسيط موجود — أضف دور المالك
        if (!existingPassword) {
          toast.error("لديك حساب كوسيط. أدخل كلمة المرور لربط دور المالك.");
          setLoading(false);
          return;
        }
        const loginEmail = check.email || form.email;
        const { error: lErr } = await supabase.auth.signInWithPassword({
          email: loginEmail!,
          password: existingPassword,
        });
        if (lErr) throw new Error("كلمة المرور غير صحيحة");
        userId = check.user_id;
      } else {
        // سيناريو أ: مستخدم جديد كليًا — بريد حقيقي
        const redirectUrl = `${window.location.origin}/choose-plan`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: redirectUrl, data: { full_name: form.full_name, phone: phoneFmt } },
        });
        if (authErr) {
          const msg = (authErr.message || "").toLowerCase();
          if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
            toast.error("هذا البريد مسجّل مسبقًا. سجّل الدخول.");
            navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
            return;
          }
          throw authErr;
        }
        userId = authData.user?.id ?? null;
        if (!authData.session && userId) {
          await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        }
      }

      if (!userId) throw new Error("تعذّر إنشاء/جلب الحساب");
      await insertOwnerProfile(userId, phoneFmt);

      toast.success("تم إعداد حسابك. اختر باقتك للمتابعة.");
      navigate("/choose-plan", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  const isExistingBroker = accountCheck?.exists && accountCheck.has_business_card && !accountCheck.has_owner_profile;

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
            onPhoneChange={(v) => { update("phone", v); setAccountCheck(null); }}
            onVerified={handlePhoneVerified}
            label="رقم الجوال *"
          />

          {isExistingBroker && (
            <div className="rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 p-3 text-sm">
              اكتشفنا أن لديك حسابًا كوسيط بهذا الرقم. أدخل كلمة مرور حساب الوسيط لربط دور المالك بنفس الحساب — لن نُنشئ حسابًا جديدًا.
              <div className="mt-3">
                <Label>كلمة مرور حساب الوسيط</Label>
                <Input type="password" value={existingPassword} onChange={(e) => setExistingPassword(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label>البريد الإلكتروني *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              dir="ltr"
              disabled={isExistingBroker && !!accountCheck?.email}
            />
          </div>

          {!isExistingBroker && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كلمة المرور</Label>
                <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} /></div>
              <div><Label>تأكيدها</Label>
                <Input type="password" value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} /></div>
            </div>
          )}

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
            {loading ? "..." : isExistingBroker ? "ربط دور المالك" : "إنشاء الحساب"}
          </Button>
        </div>
      </div>
    </div>
  );
}
