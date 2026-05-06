import { supabase } from "@/integrations/supabase/client";

/**
 * يربط إرسال المالك (owner_submissions) بوسيط معيّن عبر slug،
 * مستخدماً نفس edge function الذي تستخدمه النماذج العامة (public-form-submit).
 * هذا يضمن أن البيانات تظهر في CRM الوسيط بنفس مسار النماذج العامة.
 */
export async function submitToBrokerCRM(params: {
  submissionId: string;
  brokerSlug: string;
  brokerUserId: string;
}) {
  const { submissionId, brokerSlug, brokerUserId } = params;

  // 1) اقرأ الإرسال
  const { data: sub, error: subErr } = await supabase
    .from("owner_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (subErr || !sub) throw new Error("لم يتم العثور على الإرسال");

  const formType: "offer" | "request" = sub.submission_type === "request" ? "request" : "offer";
  const d: any = sub.data || {};

  const submissionData = {
    id: `owner_${sub.id}`,
    type: formType === "offer" ? "property_offer" : "property_request",
    source: "هنا وسيطك",
    ownerName: d.ownerName,
    ownerPhone: d.ownerPhone,
    propertyType: d.propertyType,
    purpose: sub.purpose,
    area: d.area,
    price: d.price,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    description: d.description,
    locationCity: sub.city,
    locationDistrict: sub.district,
    media: sub.media || [],
    submittedAt: new Date().toISOString(),
    status: "pending",
    isNew: true,
    isViewed: false,
  };

  // 2) ادفعها لنفس Edge Function لإنشاء سجل في CRM الوسيط
  const { data: response, error: fnErr } = await supabase.functions.invoke(
    "public-form-submit",
    { body: { slug: brokerSlug, formType, data: submissionData } }
  );
  if (fnErr) throw new Error(fnErr.message || "تعذّر الإرسال إلى الوسيط");
  if (!response?.success) throw new Error(response?.error || "فشل الإرسال");

  // 3) حدّث حالة الإرسال إلى "broker_assigned" مع ربط الوسيط
  const { error: updErr } = await supabase
    .from("owner_submissions")
    .update({
      status: "broker_assigned",
      assigned_broker_slug: brokerSlug,
      assigned_broker_user_id: brokerUserId,
    })
    .eq("id", submissionId);
  if (updErr) throw updErr;

  return { success: true };
}