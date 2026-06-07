import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

type Authority = 'REGA' | 'MOH' | 'SAMA' | 'EJAR' | 'ZATCA' | 'REDF' | 'OTHER';
type Severity = 'mandatory' | 'alert' | 'info';

interface RssItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

interface Source {
  authority: Authority;
  url: string;
  kind: 'rss' | 'html';
  selector?: { item: string; title: string; link: string; date?: string };
  baseUrl?: string;
}

// نستخدم Google News RSS كوسيط موثوق لكل جهة رسمية (مستقر، بدون مفاتيح، لا CORS من السيرفر).
// كل استعلام مقيّد بـ site: للموقع الرسمي للجهة لضمان أن النتائج من المصدر فقط.
const gnewsRss = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=SA&ceid=SA:ar`;

const SOURCES: Source[] = [
  { authority: 'REGA', kind: 'rss', url: gnewsRss('site:rega.gov.sa OR "الهيئة العامة للعقار"') },
  { authority: 'SAMA', kind: 'rss', url: gnewsRss('site:sama.gov.sa OR "البنك المركزي السعودي" قرار OR تعليمات') },
  { authority: 'MOH',  kind: 'rss', url: gnewsRss('site:housing.gov.sa OR "وزارة الإسكان" السعودية') },
  { authority: 'EJAR', kind: 'rss', url: gnewsRss('site:ejar.sa OR "منصة إيجار"') },
  { authority: 'ZATCA', kind: 'rss', url: gnewsRss('site:zatca.gov.sa "ضريبة التصرفات العقارية" OR عقار') },
  { authority: 'REDF', kind: 'rss', url: gnewsRss('site:redf.gov.sa OR "صندوق التنمية العقارية"') },
];

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const tag = (block: string, name: string) => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (!m) return undefined;
    return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
  };
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = tag(block, 'title');
    const link = tag(block, 'link');
    if (!title || !link) continue;
    items.push({
      title,
      link,
      description: tag(block, 'description'),
      pubDate: tag(block, 'pubDate'),
      guid: tag(block, 'guid') ?? link,
    });
  }
  return items;
}

async function fetchRss(src: Source): Promise<RssItem[]> {
  const res = await fetch(src.url, {
    headers: { 'User-Agent': 'WasataAI-RegulatoryBot/1.0', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
  });
  if (!res.ok) throw new Error(`RSS ${src.authority} ${res.status}`);
  const xml = await res.text();
  return parseRss(xml).slice(0, 15);
}

async function fetchHtmlList(src: Source): Promise<RssItem[]> {
  // محاولة بسيطة: نجلب HTML ونستخرج الروابط/العناوين عبر regex.
  // الأفضلية لاستخدام Firecrawl لاحقاً لو توفّر.
  const res = await fetch(src.url, { headers: { 'User-Agent': 'WasataAI-RegulatoryBot/1.0' } });
  if (!res.ok) throw new Error(`HTML ${src.authority} ${res.status}`);
  const html = await res.text();
  const items: RssItem[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null && items.length < 20) {
    let href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text || text.length < 15 || text.length > 250) continue;
    if (!/news|news-details|article|قرار|إعلان|خبر/i.test(href)) continue;
    if (href.startsWith('/')) href = (src.baseUrl ?? new URL(src.url).origin) + href;
    if (seen.has(href)) continue;
    seen.add(href);
    items.push({ title: text, link: href, guid: href });
  }
  return items;
}

function classifySeverity(title: string, summary: string | undefined): Severity {
  const text = `${title} ${summary ?? ''}`;
  if (/إلزام|يلزم|عقوبة|غرامة|يجب|قرار|نظام|لائحة/i.test(text)) return 'mandatory';
  if (/تنبيه|تحذير|تعديل|تحديث|إيقاف|تعليق/i.test(text)) return 'alert';
  return 'info';
}

async function summarizeArabic(title: string, body: string | undefined): Promise<string | null> {
  if (!LOVABLE_API_KEY) return body?.slice(0, 240) ?? null;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'لخّص للوسيط العقاري السعودي في جملتين عربيتين فقط، بدون مقدمات.' },
          { role: 'user', content: `العنوان: ${title}\n\nالنص: ${body ?? ''}` },
        ],
        max_tokens: 180,
      }),
    });
    if (!res.ok) return body?.slice(0, 240) ?? null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return body?.slice(0, 240) ?? null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const stats: Record<string, { fetched: number; inserted: number; error?: string }> = {};

  for (const src of SOURCES) {
    const key = `${src.authority}:${src.kind}`;
    stats[key] = { fetched: 0, inserted: 0 };
    try {
      const items = src.kind === 'rss' ? await fetchRss(src) : await fetchHtmlList(src);
      stats[key].fetched = items.length;

      for (const it of items) {
        const externalId = it.guid ?? it.link;
        // dedupe
        const { data: existing } = await supabase
          .from('regulatory_updates')
          .select('id')
          .eq('authority', src.authority)
          .eq('external_id', externalId)
          .maybeSingle();
        if (existing) continue;

        const summary = await summarizeArabic(it.title, it.description);
        const severity = classifySeverity(it.title, summary ?? undefined);
        const publishedAt = it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString();

        const { error } = await supabase.from('regulatory_updates').insert({
          authority: src.authority,
          title: it.title.slice(0, 500),
          summary,
          severity,
          source_url: it.link,
          published_at: publishedAt,
          external_id: externalId,
        });
        if (!error) stats[key].inserted += 1;
      }
    } catch (e) {
      stats[key].error = (e as Error).message;
    }
  }

  return new Response(JSON.stringify({ ok: true, stats }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});