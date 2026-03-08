import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAcademyHome, getAcademyLogin, getAcademyDashboard } from "@/utils/academyPaths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const generateTemporaryPassword = () => {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'A1!';
};

const AcademyRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    licenseNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePhone = (phone: string) => /^05\d{8}$/.test(phone);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "الاسم الثلاثي مطلوب";
    if (!validatePhone(form.phone)) newErrors.phone = "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام";
    if (!validateEmail(form.email)) newErrors.email = "البريد الإلكتروني غير صحيح";
    if (!form.city.trim()) newErrors.city = "المدينة مطلوبة";
    if (!form.district.trim()) newErrors.district = "الحي مطلوب";
    if (!form.licenseNumber.trim()) newErrors.licenseNumber = "رقم الرخصة مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // تحقق من أن البريد غير مسجل
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .or(`phone.eq.${form.phone},phone.eq.${form.phone.replace('05', '+9665')}`)
        .limit(1);

      if (existingProfile && existingProfile.length > 0) {
        setErrors({ email: "هذا الحساب مسجل بالفعل، يرجى تسجيل الدخول" });
        setLoading(false);
        return;
      }

      // إنشاء المستخدم
      const password = generateTemporaryPassword();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password,
        options: {
          data: { full_name: form.fullName },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setErrors({ email: "البريد مسجل بالفعل، يرجى تسجيل الدخول" });
        } else {
          toast.error(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        // تحديث الملف الشخصي
        await supabase.from("profiles").upsert({
          user_id: signUpData.user.id,
          full_name: form.fullName,
          phone: form.phone,
          fal_license_number: form.licenseNumber,
          office_address: `${form.city} - ${form.district}`,
        });

        // تسجيل الدخول تلقائياً
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password,
        });

        if (signInError) {
          toast.info("تم إنشاء الحساب بنجاح. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.");
          navigate(getAcademyLogin());
        } else {
          toast.success("تم إنشاء حسابك بنجاح! مرحباً بك في أكاديمية وسيط");
          navigate(getAcademyDashboard());
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2942] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/academy" className="inline-flex items-center gap-2 text-white mb-4">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-white">أكاديمية وسيط</span>
          </Link>
          <h1 className="text-xl text-gray-300">إنشاء حساب جديد</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <Label className="text-white">الاسم الثلاثي</Label>
            <Input
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="محمد أحمد العلي"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label className="text-white">رقم الجوال</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="05xxxxxxxx"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              dir="ltr"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label className="text-white">البريد الإلكتروني</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="example@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              dir="ltr"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">
                {errors.email}{" "}
                {errors.email.includes("تسجيل الدخول") && (
                  <Link to="/academy/login" className="text-[#D4AF37] underline">تسجيل الدخول</Link>
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white">المدينة</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="الرياض"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <Label className="text-white">الحي</Label>
              <Input
                value={form.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder="النرجس"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
              {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district}</p>}
            </div>
          </div>

          <div>
            <Label className="text-white">رقم الرخصة (فال)</Label>
            <Input
              value={form.licenseNumber}
              onChange={(e) => updateField("licenseNumber", e.target.value)}
              placeholder="رقم رخصة فال"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
            />
            {errors.licenseNumber && <p className="text-red-400 text-xs mt-1">{errors.licenseNumber}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-black font-bold py-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إنشاء حساب والبدء"}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            لديك حساب؟{" "}
            <Link to="/academy/login" className="text-[#D4AF37] hover:underline">سجل دخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AcademyRegister;
