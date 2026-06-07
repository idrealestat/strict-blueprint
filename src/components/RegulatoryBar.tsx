/**
 * RegulatoryBar.tsx
 * شريط التحديثات التنظيمية الرسمية للوسيط العقاري
 * مصادر: REGA, SAMA, MOH, EJAR, ZATCA, REDF
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Landmark,
  ShieldAlert,
  Info,
  RefreshCw,
  List,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Authority = 'REGA' | 'MOH' | 'SAMA' | 'EJAR' | 'ZATCA' | 'REDF' | 'OTHER';
type Severity = 'mandatory' | 'alert' | 'info';

interface RegulatoryUpdate {
  id: string;
  authority: Authority;
  title: string;
  summary: string | null;
  severity: Severity;
  source_url: string;
  document_url: string | null;
  published_at: string;
  tags: string[] | null;
}

const AUTHORITY_LABEL: Record<Authority, string> = {
  REGA: 'الهيئة العامة للعقار',
  MOH: 'وزارة الإسكان',
  SAMA: 'البنك المركزي',
  EJAR: 'منصة إيجار',
  ZATCA: 'الزكاة والضريبة',
  REDF: 'صندوق التنمية العقارية',
  OTHER: 'جهة أخرى',
};

const SEVERITY_STYLES: Record<Severity, { label: string; class: string; Icon: typeof ShieldAlert }> = {
  mandatory: { label: 'إلزامي', class: 'bg-red-600 text-white border-red-700', Icon: ShieldAlert },
  alert: { label: 'تنبيه', class: 'bg-amber-500 text-white border-amber-600', Icon: ShieldAlert },
  info: { label: 'معلومة', class: 'bg-emerald-600 text-white border-emerald-700', Icon: Info },
};

const STORAGE_KEY = 'regulatory_bar_collapsed';
const LAST_SEEN_KEY = 'regulatory_bar_last_seen';
const MODE_KEY = 'regulatory_bar_mode';
type DisplayMode = 'list' | 'ticker';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const RegulatoryBar = () => {
  const [items, setItems] = useState<RegulatoryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });
  const [selected, setSelected] = useState<RegulatoryUpdate | null>(null);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
  });
  const [mode, setMode] = useState<DisplayMode>(() => {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem(MODE_KEY) as DisplayMode) || 'list';
  });

  const toggleMode = () => {
    setMode((m) => {
      const next: DisplayMode = m === 'list' ? 'ticker' : 'list';
      localStorage.setItem(MODE_KEY, next);
      return next;
    });
  };

  const load = async () => {
    const { data, error } = await supabase
      .from('regulatory_updates')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(40);
    if (!error && data) setItems(data as unknown as RegulatoryUpdate[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('regulatory-updates-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'regulatory_updates' },
        (payload) => {
          setItems((prev) => [payload.new as RegulatoryUpdate, ...prev].slice(0, 40));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      if (!next) markSeen();
      return next;
    });
  };

  const markSeen = () => {
    const now = Date.now();
    setLastSeen(now);
    localStorage.setItem(LAST_SEEN_KEY, String(now));
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke('fetch-regulatory-updates');
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const newCount = useMemo(() => {
    if (!lastSeen) return items.length;
    return items.filter((i) => new Date(i.published_at).getTime() > lastSeen).length;
  }, [items, lastSeen]);

  const hasMandatory = items.some((i) => i.severity === 'mandatory');

  return (
    <div
      dir="rtl"
      className="rounded-lg shadow-lg border-2 border-amber-500 overflow-hidden bg-gradient-to-l from-[#01411C] via-[#0a5a2c] to-[#01411C] text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded" />
          <Landmark className="w-5 h-5" />
          <h3 className="font-bold text-base sm:text-lg">التحديثات التنظيمية الرسمية</h3>
          {hasMandatory && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
          {newCount > 0 && (
            <Badge className="bg-amber-500 text-[#01411C] border-0 font-bold">
              {newCount} جديد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMode}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title={mode === 'list' ? 'عرض كشريط متحرك' : 'عرض كقائمة'}
          >
            {mode === 'list' ? (
              <Megaphone className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="تحديث"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={toggleCollapsed}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title={collapsed ? 'فرد' : 'طيّ'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && mode === 'list' && (
        <div className="bg-white/95 text-gray-900 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">جارٍ تحميل التحديثات…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              لا توجد تحديثات بعد. اضغط زر التحديث لجلب آخر القرارات الرسمية.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => {
                const sev = SEVERITY_STYLES[item.severity];
                const SevIcon = sev.Icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setSelected(item)}
                      className="w-full text-right p-3 hover:bg-emerald-50 transition-colors flex items-start gap-3"
                    >
                      <Badge className={cn('shrink-0 gap-1 border', sev.class)}>
                        <SevIcon className="w-3 h-3" />
                        {sev.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>{AUTHORITY_LABEL[item.authority]}</span>
                          <span>•</span>
                          <span>{formatDate(item.published_at)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Ticker Mode */}
      {!collapsed && mode === 'ticker' && (
        <div className="bg-gradient-to-r from-[#01411C] via-[#0a5a2c] to-[#01411C] p-2 border-t border-amber-500/30">
          {loading ? (
            <div className="text-center text-sm text-white/80 py-2">جارٍ التحميل…</div>
          ) : items.length === 0 ? (
            <div className="text-center text-sm text-white/80 py-2">لا توجد تحديثات.</div>
          ) : (
            <div className="overflow-hidden h-8 relative">
              <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[#01411C] to-transparent z-10" />
              <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-[#01411C] to-transparent z-10" />
              <div className="flex animate-marquee-rtl whitespace-nowrap hover:[animation-play-state:paused]">
                {[...items, ...items].map((item, i) => {
                  const sev = SEVERITY_STYLES[item.severity];
                  return (
                    <span
                      key={`${item.id}-${i}`}
                      className="inline-flex items-center mx-6 cursor-pointer group"
                      onClick={() => setSelected(item)}
                    >
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border',
                          sev.class
                        )}
                      >
                        {sev.label}
                      </span>
                      <span className="mx-2 text-amber-300 text-xs font-medium">
                        {AUTHORITY_LABEL[item.authority]}
                      </span>
                      <span className="text-white group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-amber-400 text-xs mx-2">
                        • {formatDate(item.published_at)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" dir="rtl" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn('border', SEVERITY_STYLES[selected.severity].class)}>
                    {SEVERITY_STYLES[selected.severity].label}
                  </Badge>
                  <Badge variant="outline">{AUTHORITY_LABEL[selected.authority]}</Badge>
                </div>
                <SheetTitle className="text-right leading-relaxed">{selected.title}</SheetTitle>
                <SheetDescription className="text-right">
                  {formatDate(selected.published_at)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {selected.summary && (
                  <p className="text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                    {selected.summary}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button asChild className="bg-[#01411C] hover:bg-[#01411C]/90">
                    <a href={selected.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 ml-2" />
                      فتح المصدر الرسمي
                    </a>
                  </Button>
                  {selected.document_url && (
                    <Button asChild variant="outline">
                      <a href={selected.document_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 ml-2" />
                        الوثيقة الرسمية (PDF)
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RegulatoryBar;