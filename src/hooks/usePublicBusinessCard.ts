import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PublicBusinessCardData = Record<string, any> & { swapState?: boolean };

export function usePublicBusinessCard(slug: string | undefined) {
  const [data, setData] = useState<PublicBusinessCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error } = await supabase
        .from("business_cards")
        .select("data")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setData(null);
        setLoading(false);
        return;
      }

      setData((data?.data as PublicBusinessCardData) ?? null);
      setLoading(false);
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { data, loading, error };
}
