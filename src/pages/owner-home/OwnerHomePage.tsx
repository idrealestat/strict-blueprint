import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bell, Menu, FileText, Inbox, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OwnerHomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromSubmission = params.get("from") === "submission";

  const [name, setName] = useState("");
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login?redirect=/owner/home", { replace: true });
        return;
      }
      const { data: prof } = await supabase
        .from("owner_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof?.full_name) setName(prof.full_name);

      const { count } = await supabase
        .from("owner_submissions")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", user.id)
        .in("status", ["draft", "saved"]);
      setPendingDrafts(count || 0);
      if ((count || 0) > 0 || fromSubmission) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 8000);
      }
    })();
  }, [navigate, fromSubmission]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate("/", { replace: true });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>لوحة المالك | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white border-b-4 border-[#D4AF37] py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button className="text-white"><Bell className="w-6 h-6" /></button>
          <h1 className="text-lg md:text-xl font-bold">مرحبًا{name ? `، ${name}` : ""}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-white"><Menu className="w-6 h-6" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-cairo">
              <DropdownMenuItem onClick={() => navigate("/owner/home")}>
                الصفحة الرئيسية
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/owner/performance")}>
                الأداء — الباقة المطورة
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            {showHint && (
              <div className="absolute -top-12 right-2 bg-[#D4AF37] text-[#01411C] text-sm font-bold px-3 py-2 rounded-lg shadow-lg animate-bounce z-10">
                قم بمراجعة عرضك/طلبك من هنا وتأكيد إرساله
                <span className="absolute -bottom-2 right-6 w-3 h-3 bg-[#D4AF37] rotate-45"></span>
              </div>
            )}
            <Link
              to="/owner/submissions"
              className="block bg-card border-2 border-[#D4AF37] rounded-2xl p-6 hover:shadow-xl transition relative"
            >
              <FileText className="w-10 h-10 text-[#01411C] mb-3" />
              <h3 className="text-xl font-bold mb-1">إرسال العروض والطلبات</h3>
              <p className="text-sm text-muted-foreground">أنشئ عرضًا أو طلبًا جديدًا أو راجع المسودات</p>
              {pendingDrafts > 0 && (
                <span className="absolute top-3 left-3 bg-[#01411C] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pendingDrafts} مسودة
                </span>
              )}
            </Link>
          </div>

          <Link
            to="/owner/accepted"
            className="block bg-card border-2 border-muted rounded-2xl p-6 hover:shadow-xl transition"
          >
            <Inbox className="w-10 h-10 text-[#01411C] mb-3" />
            <h3 className="text-xl font-bold mb-1">العروض والطلبات المقبولة</h3>
            <p className="text-sm text-muted-foreground">تابع حالة طلباتك والوسطاء المرتبطين بها</p>
          </Link>
        </div>

        <div className="mt-6 bg-gradient-to-l from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/40 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <h4 className="font-bold">باقة مطورة</h4>
              <p className="text-sm text-muted-foreground">تابع أداء عقاراتك وأعلى الوسطاء أداءً</p>
            </div>
          </div>
          <Link
            to="/owner/performance"
            className="bg-[#D4AF37] text-[#01411C] font-bold px-4 py-2 rounded-lg"
          >
            عرض الأداء
          </Link>
        </div>
      </main>
    </div>
  );
}