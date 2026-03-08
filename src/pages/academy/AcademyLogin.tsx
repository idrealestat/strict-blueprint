import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        navigate("/academy/dashboard");
      }
    } catch (err) {
      setError("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/academy" className="inline-flex items-center gap-2 text-white mb-4">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-white">أكاديمية وسيط</span>
          </Link>
          <h1 className="text-xl text-gray-300">تسجيل الدخول</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <Label className="text-white">البريد الإلكتروني</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="example@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              dir="ltr"
            />
          </div>

          <div>
            <Label className="text-white">كلمة المرور</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              dir="ltr"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold py-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            ليس لديك حساب؟{" "}
            <Link to="/academy/register" className="text-[#D4AF37] hover:underline">سجل الآن</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AcademyLogin;
