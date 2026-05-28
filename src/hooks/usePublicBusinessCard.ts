import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PublicBusinessCardData = Record<string, any> & { swapState?: boolean };

export function usePublicBusinessCard(slug: string | undefined) {
  const [data, setData] = useState<PublicBusinessCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!slug) {
        if (!isMounted) return;
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      console.log("[usePublicBusinessCard] Fetching for slug:", slug);

      const { data, error } = await supabase
        .from("public_business_cards")
        .select("data, published, slug, user_id")
        .eq("slug", slug)
        .maybeSingle();

      if (!isMounted) return;

      console.log("[usePublicBusinessCard] Response:", { data, error });

      if (error) {
        console.error("[usePublicBusinessCard] Error:", error);
        setError(error.message);
        setData(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      // التحقق من أن البطاقة منشورة
      if (!data || data.published !== true) {
        console.log("[usePublicBusinessCard] Card not found or not published");
        setData(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      setData((data?.data as PublicBusinessCardData) ?? null);
      setUserId(data?.user_id ?? null);
      setLoading(false);
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error, userId };
}
