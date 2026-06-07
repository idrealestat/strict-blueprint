import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Landmark } from "lucide-react";

interface BankRate {
  id: string;
  code: string;
  name_ar: string;
  category: string;
  value: number;
  previous_value: number | null;
  change_pct: number | null;
  trend: string | null;
  unit: string | null;
  source: string | null;
  source_url: string | null;
  updated_at: string;
}

const categoryLabel: Record<string, string> = {
  saibor: "سايبور",
  policy: "سياسة نقدية",
  mortgage: "رهن عقاري",
};

const categoryColor: Record<string, string> = {
  saibor: "bg-blue-500/20 text-blue-100 border-blue-400/40",
  policy: "bg-amber-500/20 text-amber-100 border-amber-400/40",
  mortgage: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
};

export default function BankRatesBar() {
  const [rates, setRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = async () => {
    const { data } = await supabase
      .from("bank_rates")
      .select("*")
      .order("category", { ascending: true })
      .order("code", { ascending: true });
    if (data) {
      setRates(data as BankRate[]);
      setLastUpdate(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("bank_rates_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bank_rates" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("fetch-bank-rates");
      await load();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const formatTime = () =>
    lastUpdate.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3 rounded-lg shadow-lg border-2 border-blue-500/60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded" />
          <Landmark className="w-5 h-5 text-white" />
          <h3 className="font-bold text-lg text-white">المؤشرات البنكية الحيّة</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">آخر تحديث: {formatTime()}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-1.5 hover:bg-white/15 rounded-full transition-colors"
            title="تحديث المؤشرات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/70">حيّ</span>
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/60" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden h-9 relative">
        <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-slate-900 to-transparent z-10" />
        <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-slate-900 to-transparent z-10" />
        <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {[...rates, ...rates].map((r, i) => {
            const TrendIcon =
              r.trend === "up" ? TrendingUp : r.trend === "down" ? TrendingDown : Minus;
            const trendColor =
              r.trend === "up"
                ? "text-emerald-400"
                : r.trend === "down"
                ? "text-red-400"
                : "text-white/60";
            return (
              <span
                key={`${r.id}-${i}`}
                className="inline-flex items-center mx-5 cursor-pointer group"
                onClick={() => r.source_url && window.open(r.source_url, "_blank")}
              >
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    categoryColor[r.category] ?? "bg-white/10 text-white border-white/20"
                  }`}
                >
                  {categoryLabel[r.category] ?? r.category}
                </span>
                <span className="mx-2 text-white font-medium">{r.name_ar}</span>
                <span className="font-bold text-white tabular-nums">
                  {Number(r.value).toFixed(2)}
                  {r.unit ?? ""}
                </span>
                <span className={`flex items-center gap-0.5 mr-2 ${trendColor}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span className="text-xs tabular-nums">
                    {r.change_pct != null ? `${r.change_pct > 0 ? "+" : ""}${r.change_pct}%` : "—"}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}