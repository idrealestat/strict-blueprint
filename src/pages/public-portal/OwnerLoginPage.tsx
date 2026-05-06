import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Building2, Mail, Phone, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/owner/home";

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneFmt, setPhoneFmt] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizePhone = (s: string) => {
    const digits = s.replace(/\D/g, "");
    if (digits.startsWith("9665")) return "+" + digits;
    if (digits.startsWith("05")) return "+966" + digits.substring(1);
    if (digits.startsWith("5") && digits.length === 9) return "+966" + digits;
    return null;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("أدخل البريد وكلمة المرور"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("مرحباً بعودتك!");
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "فشل تسجيل الدخول");
    } finally { setLoading(false); }
  };

  const sendOtp = async () => {
    const fmt = normalizePhone(phone);
    if (!fmt) { toast.error("صيغة رقم الجوال غير صحيحة"); return; }
    setPhoneFmt(fmt);
    setLoading(true);
    try {
      // الدالة تتوقع صيغة 05xxxxxxxx
      const localPhone = phone.replace(/\D/g, "").replace(/^966/, "0").replace(/^(?!0)5/, "05");
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone: localPhone, identifier: fmt },
      });
      if (error || !data?.success) throw new Error(data?.error || "فشل إرسال الرمز");
      toast.success("تم إرسال الرمز عبر واتساب");
      setOtpSent(true);
    } catch (err: any) { toast.error(err?.message); }
    finally { setLoading(false); }
  };

  const verifyOtpLogin = async () => {
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

      toast.success("مرحباً بعودتك!");
      navigate(redirect, { replace: true });
    } catch (err: any) { toast.error(err?.message); }
    finally { setLoading(false); }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 font-cairo"
    >
      <Helmet><title>تسجيل دخول المالك | وساطة AI</title></Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div
              className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <Building2 className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">مرحباً بعودتك</CardTitle>
              <CardDescription className="mt-2">
                سجّل دخولك للوصول إلى لوحة المالك / الباحث عن عقار
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "email" | "phone")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </TabsTrigger>
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الجوال
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>رقم الجوال</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="05xxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-10"
                          dir="ltr"
                          disabled={loading}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button onClick={sendOtp} size="lg" disabled={loading || !phone} className="w-full">
                      {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      أدخل الرمز المُرسل إلى <span dir="ltr" className="font-medium text-foreground">{phoneFmt}</span>
                    </p>
                    <div className="flex justify-center" dir="ltr">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button onClick={verifyOtpLogin} size="lg" disabled={loading || otp.length !== 6} className="w-full">
                      {loading ? "جاري التحقق..." : "تسجيل الدخول"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setOtpSent(false); setOtp(""); }}
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 ml-2" />
                      تغيير الرقم
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                to={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-primary font-bold hover:underline"
              >
                إنشاء حساب جديد
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
