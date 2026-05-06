import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CreditCard, Headphones, Settings, LogOut, ClipboardList, Building2, Hammer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tier = "basic" | "developed";

interface Props {
  open: boolean;
  onClose: () => void;
  tier: Tier;
}

export default function OwnerRightSlider({ open, onClose, tier }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate("/", { replace: true });
  };

  const Item = ({ icon: Icon, label, onClick, to }: any) => {
    const cls =
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-right text-foreground border border-border";
    const inner = (
      <>
        <Icon className="w-5 h-5 text-[#01411C]" />
        <span className="font-bold">{label}</span>
      </>
    );
    if (to) return <Link to={to} onClick={onClose} className={cls}>{inner}</Link>;
    return <button onClick={() => { onClick?.(); onClose(); }} className={cls}>{inner}</button>;
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" dir="rtl" className="font-cairo w-[300px] sm:w-[340px]">
        <SheetHeader>
          <SheetTitle className="text-[#01411C]">القائمة</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          <Item icon={CreditCard} label="بطاقة الأعمال الرقمية" to="/app/businesscard/edit" />

          {tier === "developed" && (
            <>
              <Item icon={ClipboardList} label="المقيمين" onClick={() => toast.info("قريبًا")} />
              <Item icon={Building2} label="المكاتب الهندسية" onClick={() => toast.info("قريبًا")} />
              <Item icon={Hammer} label="المقاولين" onClick={() => toast.info("قريبًا")} />
            </>
          )}

          <Item icon={Headphones} label="خدمة العملاء" onClick={() => toast.info("قريبًا")} />
          <Item icon={Settings} label="الإعدادات" onClick={() => toast.info("قريبًا")} />
          <Item icon={LogOut} label="تسجيل الخروج" onClick={handleLogout} />
        </div>
      </SheetContent>
    </Sheet>
  );
}