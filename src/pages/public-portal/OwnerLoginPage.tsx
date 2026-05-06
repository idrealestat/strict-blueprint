import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Mode = "input" | "password" | "otp";

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<Mode>("input");
  const [loading, setLoading] = useState(false);
  const [phoneFmt, setPhoneFmt] = useState("");

  const isEmail = (s: string) => s.includes("@");
  const normalizePhone = (s: string) => {
    const digits = s.replace(/\D/g, "");
    if (digits.startsWith("9665")) return "+" + digits;
    if (digits.startsWith("05")) return "+966" + digits.substring(1);
    if (digits.startsWith("5") && digits.length === 9) return "+966" + digits;
    return null;
  };

  const continueLogin = async () => {
    if (isEmail(identifier)) { setMode("password"); return; }
    const fmt = normalizePhone(identifier);
    if (!fmt) { toast.error("أدخل بريدًا أو رقم جوال سعودي"); return; }
    setPhoneFmt(fmt);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone: fmt, identifier: fmt },
      });
      if (error || !data?.success) throw new Error(data?.error || "فشل إرسال الرمز");
      toast.success("تم إرسال الرمز عبر واتساب");
      setMode("otp");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const loginPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (error) throw error;
      toast.success("تم تسجيل الدخول");
      navigate(redirect, { replace: true });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const loginPhone = async () => {
    setLoading(true);
    try {
      const { data: vData, error: vErr } = await supabase.functions.invoke("verify-otp", {
        body: { identifier: phoneFmt, code: otp, type: "phone" },
      });
      if (vErr || !vData?.success) throw new Error(vData?.error || "رمز خاطئ");

      const { data: prof } = await supabase
        .from("owner_profiles")
        .select("user_id")
        .eq("phone", phoneFmt)
        .maybeSingle();
      if (!prof) {
        toast.error("لست مسجلاً كمالك بعد. أكمل التسجيل لإضافة دور المالك.");
        navigate(`/register?redirect=${encodeURIComponent(redirect)}`, { replace: true });
        return;
      }

      const { data: lData, error: lErr } = await supabase.functions.invoke("phone-login", {
        body: { userId: prof.user_id, phone: phoneFmt },
      });
      if (lErr || !lData?.success) throw new Error(lData?.error || "فشل تسجيل الدخول");

      const { error: sErr } = await supabase.auth.setSession({
        access_token: lData.access_token,
        refresh_token: lData.refresh_token,
      });
      if (sErr) throw sErr;

      toast.success("تم تسجيل الدخول");
      navigate(redirect, { replace: true });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo py-12 px-4">
      <Helmet><title>تسجيل الدخول | وساطة AI</title></Helmet>
      <div className="max-w-md mx-auto bg-card border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-[#01411C] mb-1">تسجيل الدخول</h1>
        <p className="text-sm text-center text-muted-foreground mb-6">
          ليس لديك حساب؟ <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-[#D4AF37] font-bold">سجّل الآن</Link>
        </p>

        {mode === "input" && (
          <div className="space-y-4">
            <div><Label>رقم الجوال أو البريد الإلكتروني</Label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} dir="ltr" /></div>
            <Button onClick={continueLogin} disabled={loading || !identifier} className="w-full bg-[#01411C] hover:bg-[#065f41]">
              {loading ? "..." : "متابعة"}
            </Button>
          </div>
        )}

        {mode === "password" && (
          <div className="space-y-4">
            <div><Label>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button onClick={loginPassword} disabled={loading || !password} className="w-full bg-[#01411C] hover:bg-[#065f41]">
              {loading ? "..." : "دخول"}
            </Button>
            <button onClick={() => setMode("input")} className="text-sm text-muted-foreground">رجوع</button>
          </div>
        )}

        {mode === "otp" && (
          <div className="space-y-4 text-center">
            <p>أدخل الرمز المُرسل إلى {phoneFmt}</p>
            <div className="flex justify-center" dir="ltr">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={loginPhone} disabled={loading || otp.length !== 6} className="w-full bg-[#D4AF37] text-[#01411C] hover:bg-[#c19f2c]">
              {loading ? "..." : "دخول"}
            </Button>
            <button onClick={() => setMode("input")} className="text-sm text-muted-foreground">رجوع</button>
          </div>
        )}
      </div>
    </div>
  );
}