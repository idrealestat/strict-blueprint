import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAcademyHome, getAcademyDashboard, getAcademyRegister } from "@/utils/academyPaths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import skylineBg from "@/assets/academy-skyline-bg.jpg";

const AcademyLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
        navigate(getAcademyDashboard());
      }
    } catch (err) {
      setError("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative font-[Cairo]" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${skylineBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-gray-100/85 via-gray-50/80 to-white/90 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Back button */}
        <div className="w-full max-w-md mb-4">
          <Link to={getAcademyHome()} className="inline-flex items-center gap-2 text-gray-600 hover:text-wasata-green transition">
            <ArrowRight className="w-5 h-5" />
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to={getAcademyHome()} className="inline-flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-wasata-green" />
              <span className="text-2xl font-bold text-gray-800">أكاديمية <span className="text-wasata-gold">وسيط</span></span>
            </Link>
            <h1 className="text-xl text-gray-600">تسجيل الدخول</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border-2 border-wasata-gold/40 shadow-[0_20px_60px_-10px_rgba(212,175,55,0.15),0_8px_20px_-8px_rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-4">
            <div>
              <Label className="text-gray-700">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="example@email.com"
                className="bg-white/60 border-gray-200 text-gray-800 placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            <div>
              <Label className="text-gray-700">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="bg-white/60 border-gray-200 text-gray-800 placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-wasata-green hover:bg-wasata-green-dark text-white font-bold py-6 shadow-lg shadow-wasata-green/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
            </Button>

            <p className="text-center text-gray-500 text-sm">
              ليس لديك حساب؟{" "}
              <Link to={getAcademyRegister()} className="text-wasata-gold hover:underline font-bold">سجل الآن</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcademyLogin;
