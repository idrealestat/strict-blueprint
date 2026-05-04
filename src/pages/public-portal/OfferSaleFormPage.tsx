import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const PROPERTY_TYPES = ["شقة", "فيلا", "أرض", "محل تجاري", "مكتب", "عمارة"];
const STEPS = ["نوع العقار", "التفاصيل", "الوصف", "الصور", "المراجعة"];

interface OfferDraft {
  property_type: string;
  area_sqm: string;
  price_sar: string;
  city: string;
  neighborhood: string;
  description: string;
  photos: string[]; // data URLs (سنرفعها عند الإرسال)
}

const EMPTY: OfferDraft = {
  property_type: "", area_sqm: "", price_sar: "",
  city: "", neighborhood: "", description: "", photos: [],
};

export default function OfferSaleFormPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OfferDraft>(EMPTY);
  const [authModal, setAuthModal] = useState(false);

  const update = (k: keyof OfferDraft, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const handlePhotos = async (files: FileList | null) => {
    if (!files) return;
    const arr: string[] = [];
    for (const f of Array.from(files).slice(0, 8)) {
      const reader = new FileReader();
      const data: string = await new Promise((res) => {
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
      arr.push(data);
    }
    update("photos", [...draft.photos, ...arr].slice(0, 8));
  };

  const canNext = () => {
    if (step === 0) return !!draft.property_type;
    if (step === 1) return !!draft.area_sqm && !!draft.price_sar && !!draft.city;
    if (step === 2) return draft.description.length >= 10;
    if (step === 3) return draft.photos.length > 0;
    return true;
  };

  const handlePublish = () => {
    sessionStorage.setItem("wasata_pending_offer", JSON.stringify({ ...draft, offer_kind: "sale" }));
    if (!isAuthenticated) {
      setAuthModal(true);
    } else {
      navigate("/huna-waseetak/offer-sale/submit");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo">
      <Helmet><title>عرض بيع عقارك | وساطة AI</title></Helmet>

      <header className="bg-[#01411C] text-white py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/huna-waseetak" className="text-[#D4AF37] font-bold">← رجوع</Link>
          <h1 className="text-xl font-bold">عرض بيع عقارك</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 text-center">
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center font-bold ${i <= step ? "bg-[#D4AF37] text-[#01411C]" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <p className="text-xs mt-1">{s}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          {step === 0 && (
            <div>
              <Label className="mb-3 block">اختر نوع العقار</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => update("property_type", t)}
                    className={`py-4 rounded-xl border-2 font-bold transition ${draft.property_type === t ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>المساحة (م²)</Label>
                <Input type="number" value={draft.area_sqm} onChange={(e) => update("area_sqm", e.target.value)} />
              </div>
              <div>
                <Label>السعر المطلوب (ر.س)</Label>
                <Input type="number" value={draft.price_sar} onChange={(e) => update("price_sar", e.target.value)} />
              </div>
              <div>
                <Label>المدينة</Label>
                <Input value={draft.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div>
                <Label>الحي</Label>
                <Input value={draft.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Label>وصف العقار</Label>
              <Textarea rows={6} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="اذكر مميزات العقار، الموقع، حالة البناء..." />
              <p className="text-xs text-muted-foreground mt-1">على الأقل 10 حروف</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <Label className="mb-2 block">صور العقار (حتى 8 صور)</Label>
              <input type="file" accept="image/*" multiple onChange={(e) => handlePhotos(e.target.files)} className="block w-full" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {draft.photos.map((p, i) => (
                  <img key={i} src={p} className="w-full h-24 object-cover rounded-lg" alt="" />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 text-sm">
              <div><b>النوع:</b> {draft.property_type}</div>
              <div><b>المساحة:</b> {draft.area_sqm} م²</div>
              <div><b>السعر:</b> {draft.price_sar} ر.س</div>
              <div><b>المدينة:</b> {draft.city} - {draft.neighborhood}</div>
              <div><b>الوصف:</b> {draft.description}</div>
              <div><b>الصور:</b> {draft.photos.length}</div>
            </div>
          )}

          <div className="flex justify-between mt-8 gap-3">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              السابق
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="bg-[#01411C] hover:bg-[#065f41]">
                التالي
              </Button>
            ) : (
              <Button onClick={handlePublish} className="bg-[#D4AF37] text-[#01411C] hover:bg-[#c19f2c]">
                نشر العرض
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={authModal} onOpenChange={setAuthModal}>
        <DialogContent dir="rtl" className="font-cairo">
          <DialogHeader>
            <DialogTitle>عمل رائع! لحفظ طلبك</DialogTitle>
            <DialogDescription>
              لحفظ عرضك وإرساله إلى الوسطاء، يرجى إنشاء حساب أو تسجيل الدخول. عرضك محفوظ ولن يضيع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={() => navigate("/login?redirect=/huna-waseetak/offer-sale/submit")} variant="outline" className="w-full">
              تسجيل الدخول
            </Button>
            <Button onClick={() => navigate("/register?redirect=/huna-waseetak/offer-sale/submit")} className="w-full bg-[#D4AF37] text-[#01411C] hover:bg-[#c19f2c]">
              إنشاء حساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}