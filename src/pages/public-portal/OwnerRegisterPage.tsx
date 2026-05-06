import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneVerificationField from "@/components/PhoneVerificationField";
import { Lock, CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";

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
  broker_data?: {
    full_name?: string | null;
    national_id?: string | null;
    date_of_birth?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    neighborhood?: string | null;
  } | null;
};

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
      const redirect = params.get("redirect") || "/app/choose-plan";

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
  const [checking, setChecking] = useState(false);
  const emailDebounceRef = useRef<number | null>(null);

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

  const runCheck = async (opts: { phone?: string; email?: string }) => {
    if (!opts.phone && !opts.email) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-account-exists", {
        body: opts,
      });
      if (error) throw error;
      const result = data as AccountCheck;
      setAccountCheck(result);

      // تعبئة تلقائية من بيانات الحساب الموجود (وسيط أو ملف عام)
      if (result?.exists && !result.has_owner_profile && result.broker_data) {
        const b = result.broker_data;
        setForm((f) => ({
          ...f,
          full_name: b.full_name || f.full_name,
          national_id: b.national_id || f.national_id,
          date_of_birth: b.date_of_birth || f.date_of_birth,
          city: b.city || f.city,
          neighborhood: b.neighborhood || f.neighborhood,
          email: b.email || result.email || f.email,
          phone: f.phone || (b.phone ?? "").replace(/^\+966/, "0"),
        }));
      } else if (result?.exists && result.email && !form.email) {
        setForm((f) => ({ ...f, email: result.email! }));
      }
    } catch (e: any) {
      console.warn("check-account-exists failed", e);
    } finally {
      setChecking(false);
    }
  };

  const handlePhoneVerified = async (verified: boolean) => {
    setPhoneVerified(verified);
    if (!verified) { setAccountCheck(null); return; }
    await runCheck({ phone: normalizePhone(form.phone), email: form.email || undefined });
  };

  const handleEmailBlur = () => {
    if (emailDebounceRef.current) window.clearTimeout(emailDebounceRef.current);
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return;
    if (accountCheck?.exists) return; // لدينا نتيجة بالفعل
    emailDebounceRef.current = window.setTimeout(() => {
      runCheck({ email: form.email, phone: phoneVerified ? normalizePhone(form.phone) : undefined });
    }, 400);
  };

  const resetIdentity = () => {
    setAccountCheck(null);
    setExistingPassword("");
    setPhoneVerified(false);
    setForm({
      phone: "", email: "", password: "", passwordConfirm: "",
      full_name: "", national_id: "", date_of_birth: "",
      city: "", neighborhood: "", agree: false,
    });
    toast.info("تم إعادة تعيين الحقول. أدخل بيانات اتصال مختلفة.");
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
    const formForValidation = skipPwd
      ? { ...form, password: "12345678", passwordConfirm: "12345678" }
      : form;
    const parsed = baseSchema.safeParse(formForValidation);
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
      // إجبار التحويل إلى لوحة المالك بعد ربط الدور (تجاوز أي Guards توجّه للبطاقة)
      sessionStorage.setItem("force_owner_redirect", "1");
      window.location.replace("/owner-home");
    } catch (e: any) {
      toast.error(e.message || "خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  const isExistingBroker = !!(accountCheck?.exists && !accountCheck.has_owner_profile && accountCheck.broker_data);
  const isExistingOwner = accountCheck?.exists && accountCheck.has_owner_profile;
  const lockedClass = "bg-muted text-muted-foreground cursor-not-allowed";

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo py-8 px-4">
      <Helmet><title>إنشاء حساب مالك عقار | وساطة AI</title></Helmet>
      <div className="max-w-xl mx-auto bg-card rounded-2xl border p-6 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#01411C] hover:text-[#065f41] font-bold"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لتعبئة الطلب
        </button>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#01411C]">إنشاء حساب مالك عقار</h1>
          <p className="text-sm text-muted-foreground mt-1">
            لديك حساب؟ <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#D4AF37] font-bold">سجّل الدخول</Link>
          </p>
        </div>

        {/* شارة الحالة */}
        {checking && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
            <Info className="h-4 w-4 animate-pulse" /> جاري التحقق من حسابك...
          </div>
        )}
        {!checking && isExistingOwner && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> لديك حساب مالك مسبقًا. <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-bold underline">سجّل الدخول</Link>
          </div>
        )}
        {!checking && isExistingBroker && (
          <div className="mb-4 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 p-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#01411C]">تم التعرّف عليك كوسيط</div>
                <div className="text-muted-foreground mt-1">
                  تم تعبئة بياناتك تلقائيًا من حسابك كوسيط. أدخل كلمة مرور حسابك ووافق على الشروط لربط دور المالك بنفس الحساب.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("سيتم مسح البيانات المعبّأة. إذا تابعت بنفس الجوال/البريد سنرفض التسجيل. هل تريد إدخال بيانات اتصال مختلفة؟")) {
                      resetIdentity();
                    }
                  }}
                  className="mt-2 text-xs text-[#01411C] underline hover:text-[#065f41]"
                >
                  هذا ليس أنا — استخدم بيانات أخرى
                </button>
              </div>
            </div>
          </div>
        )}
        {!checking && accountCheck && !accountCheck.exists && phoneVerified && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#01411C]/30 bg-[#01411C]/5 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-[#01411C]" /> حساب جديد — أكمل البيانات أدناه.
          </div>
        )}

        <div className="space-y-4">
          <PhoneVerificationField
            phone={form.phone}
            onPhoneChange={(v) => { update("phone", v); setAccountCheck(null); }}
            onVerified={handlePhoneVerified}
            label="رقم الجوال *"
          />

          <div>
            <Label className="flex items-center gap-1">
              البريد الإلكتروني *
              {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={handleEmailBlur}
              dir="ltr"
              readOnly={isExistingBroker}
              className={isExistingBroker ? lockedClass : ""}
              title={isExistingBroker ? "تم جلبه من حسابك كوسيط" : ""}
            />
          </div>

          {isExistingBroker ? (
            <div>
              <Label>كلمة مرور حساب الوسيط *</Label>
              <Input
                type="password"
                value={existingPassword}
                onChange={(e) => setExistingPassword(e.target.value)}
                placeholder="أدخل كلمة مرور حسابك الحالي"
              />
              <p className="text-xs text-muted-foreground mt-1">للتحقق من هويتك قبل ربط دور المالك.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كلمة المرور</Label>
                <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} /></div>
              <div><Label>تأكيدها</Label>
                <Input type="password" value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} /></div>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-1">
              الاسم الرباعي {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              readOnly={isExistingBroker}
              className={isExistingBroker ? lockedClass : ""}
              title={isExistingBroker ? "تم جلبه من حسابك كوسيط" : ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">
                رقم الهوية {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Input
                value={form.national_id}
                onChange={(e) => update("national_id", e.target.value.replace(/\D/g, ""))}
                dir="ltr"
                readOnly={isExistingBroker}
                className={isExistingBroker ? lockedClass : ""}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                تاريخ الميلاد {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
                readOnly={isExistingBroker}
                className={isExistingBroker ? lockedClass : ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">
                المدينة {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                readOnly={isExistingBroker}
                className={isExistingBroker ? lockedClass : ""}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                الحي {isExistingBroker && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Input
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                readOnly={isExistingBroker}
                className={isExistingBroker ? lockedClass : ""}
              />
            </div>
          </div>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" checked={form.agree} onChange={(e) => update("agree", e.target.checked)} />
            <span>أوافق على <Link to="/terms" className="text-[#D4AF37]">الشروط</Link> و<Link to="/privacy" className="text-[#D4AF37]">سياسة الخصوصية</Link></span>
          </label>

          <Button onClick={submit} disabled={loading || !phoneVerified || isExistingOwner} className="w-full bg-[#01411C] hover:bg-[#065f41]">
            {loading ? "..." : isExistingBroker ? "تأكيد وربط دور المالك" : "إنشاء الحساب"}
          </Button>
        </div>
      </div>
    </div>
  );
}
