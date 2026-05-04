import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function OfferSubmitPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();
  const ran = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login?redirect=/huna-waseetak/offer-sale/submit");
      return;
    }
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const raw = sessionStorage.getItem("wasata_pending_offer");
      if (!raw) {
        navigate("/huna-waseetak/offer-sale");
        return;
      }
      const draft = JSON.parse(raw);

      try {
        const photoUrls: string[] = [];
        for (const [i, dataUrl] of (draft.photos as string[]).entries()) {
          const blob = dataUrlToBlob(dataUrl);
          const path = `${user.id}/${Date.now()}-${i}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("property-offer-photos")
            .upload(path, blob, { contentType: blob.type, upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("property-offer-photos").getPublicUrl(path);
          photoUrls.push(pub.publicUrl);
        }

        const { error: insErr } = await supabase.from("public_property_offers").insert({
          owner_user_id: user.id,
          offer_kind: draft.offer_kind || "sale",
          property_type: draft.property_type,
          area_sqm: draft.area_sqm ? Number(draft.area_sqm) : null,
          price_sar: draft.price_sar ? Number(draft.price_sar) : null,
          city: draft.city,
          neighborhood: draft.neighborhood,
          description: draft.description,
          photos: photoUrls,
          status: "pending_review",
        });
        if (insErr) throw insErr;

        sessionStorage.removeItem("wasata_pending_offer");
        toast.success(`تم! عرضك يُرسل للوسطاء المناسبين في ${draft.city || "منطقتك"}.`);
        navigate("/huna-waseetak/offer-sale/success", { replace: true });
      } catch (e: any) {
        console.error(e);
        toast.error("تعذّر نشر العرض: " + (e.message || ""));
      }
    })();
  }, [user, loading, navigate]);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background font-cairo">
      <Helmet><title>جاري نشر عرضك...</title></Helmet>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>جاري رفع عرضك...</p>
      </div>
    </div>
  );
}