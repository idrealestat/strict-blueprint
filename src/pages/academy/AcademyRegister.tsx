import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAcademyHome, getAcademyLogin, getAcademyDashboard } from "@/utils/academyPaths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import skylineBg from "@/assets/academy-skyline-bg.jpg";

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
        await supabase.from("profiles").upsert({
          user_id: signUpData.user.id,
          full_name: form.fullName,
          phone: form.phone,
          fal_license_number: form.licenseNumber,
          office_address: `${form.city} - ${form.district}`,
        });

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

  const formCardClass = "bg-white/70 backdrop-blur-xl border-2 border-wasata-gold/40 shadow-[0_20px_60px_-10px_rgba(212,175,55,0.15),0_8px_20px_-8px_rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-4";
  const inputClass = "bg-white/60 border-gray-200 text-gray-800 placeholder:text-gray-400";

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
            <h1 className="text-xl text-gray-600">إنشاء حساب جديد</h1>
          </div>

          <form onSubmit={handleSubmit} className={formCardClass}>
            <div>
              <Label className="text-gray-700">الاسم الثلاثي</Label>
              <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="محمد أحمد العلي" className={inputClass} />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Label className="text-gray-700">رقم الجوال</Label>
              <Input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="05xxxxxxxx" className={inputClass} dir="ltr" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label className="text-gray-700">البريد الإلكتروني</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="example@email.com" className={inputClass} dir="ltr" />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email}{" "}
                  {errors.email.includes("تسجيل الدخول") && (
                    <Link to={getAcademyLogin()} className="text-wasata-gold underline">تسجيل الدخول</Link>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700">المدينة</Label>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="الرياض" className={inputClass} />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label className="text-gray-700">الحي</Label>
                <Input value={form.district} onChange={(e) => updateField("district", e.target.value)} placeholder="النرجس" className={inputClass} />
                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
              </div>
            </div>

            <div>
              <Label className="text-gray-700">رقم الرخصة (فال)</Label>
              <Input value={form.licenseNumber} onChange={(e) => updateField("licenseNumber", e.target.value)} placeholder="رقم رخصة فال" className={inputClass} />
              {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-wasata-green hover:bg-wasata-green-dark text-white font-bold py-6 shadow-lg shadow-wasata-green/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إنشاء حساب والبدء"}
            </Button>

            <p className="text-center text-gray-500 text-sm">
              لديك حساب؟{" "}
              <Link to={getAcademyLogin()} className="text-wasata-gold hover:underline font-bold">سجل دخول</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcademyRegister;
