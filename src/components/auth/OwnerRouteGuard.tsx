import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode };

export default function OwnerRouteGuard({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<"loading" | "ok" | "no-auth" | "no-owner">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState("no-auth");
        return;
      }
      const { data } = await supabase
        .from("owner_profiles")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setState(data ? "ok" : "no-owner");
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state === "loading") {
    return <div dir="rtl" className="min-h-screen flex items-center justify-center font-cairo text-muted-foreground">جاري التحقق…</div>;
  }
  if (state === "no-auth") {
    const r = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${r}`, { replace: true });
    return null;
  }
  if (state === "no-owner") {
    return (
      <div dir="rtl" className="min-h-screen bg-background font-cairo flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[#01411C] mb-2">منطقة المالك</h2>
          <p className="text-muted-foreground mb-6">لست مسجلاً كمالك. سجّل من هنا لإضافة دور المالك إلى حسابك.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-[#01411C] hover:bg-[#065f41]">
              <Link to="/register?redirect=/owner/home">سجّل كمالك</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">العودة</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}