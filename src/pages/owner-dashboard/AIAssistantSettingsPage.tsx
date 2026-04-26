/**
 * AIAssistantSettingsPage.tsx
 * صفحة إعدادات المساعد الذكي (وساطه AI) — للمالك فقط.
 *
 * تعرض القواعد الذهبية الخمس المُطبَّقة فعلياً في برومبت الـ Edge Function
 * (supabase/functions/wasata-ai-chat/index.ts) وتسمح للمالك بتفعيل/تعطيل
 * عرض كل قاعدة في هذه الصفحة. التبديل هنا عرضي فقط (UI) لأن منطق المساعد
 * نفسه يبقى ثابتاً في البرومبت — هذا حسب طلب المستخدم: «بدون تغيير أي منطق آخر».
 *
 * المرجع/المصدر لكل قاعدة موثَّق داخلياً في الكود (حقل `source`).
 */

import React from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import OwnerDashboardLayout from "./OwnerDashboardLayout";

const STORAGE_KEY = "ai_assistant_rules_visibility_v1";

interface GoldenRule {
  id: string;
  number: number;
  title: string;
  description: string;
  /** المرجع الداخلي للقاعدة (TODO إن لم يتوفر مصدر خارجي) */
  source: string;
}

/**
 * القواعد الذهبية الخمس — مطابقة حرفياً للبرومبت في:
 *   supabase/functions/wasata-ai-chat/index.ts
 * أي تعديل هنا يجب أن يبقى متوافقاً مع البرومبت الفعلي.
 */
const GOLDEN_RULES: GoldenRule[] = [
  {
    id: "no_fluff",
    number: 1,
    title: "بدون حشو",
    description:
      "لا مقدمات طويلة ولا تكرار. الإجابة مباشرة ومركّزة على سؤال المستخدم فقط.",
    source:
      "Internal: supabase/functions/wasata-ai-chat/index.ts → القواعد الذهبية الخمس (#1)",
  },
  {
    id: "no_assumptions",
    number: 2,
    title: "بلا افتراضات",
    description:
      "لا يخترع المساعد أي معلومة. عند غياب البيانات يُصرّح بذلك بدلاً من التخمين.",
    source:
      "Internal: supabase/functions/wasata-ai-chat/index.ts → القواعد الذهبية الخمس (#2)",
  },
  {
    id: "truthfulness_with_source",
    number: 3,
    title: "الصدق مع المصدر",
    description:
      "أي رقم أو نظام (مثل الهيئة العامة للعقار REGA) يُذكر مع مصدره الصريح.",
    source:
      "External: rega.gov.sa — هيئة العامة للعقار (REGA) — للمراجع التنظيمية. Internal: wasata-ai-chat (#3)",
  },
  {
    id: "brevity",
    number: 4,
    title: "خير الكلام ما قلّ ودلّ",
    description:
      "أسلوب مختصر، نقاط قصيرة عند الحاجة، بدون تعقيد لغوي أو لفظي.",
    source:
      "Internal: supabase/functions/wasata-ai-chat/index.ts → القواعد الذهبية الخمس (#4)",
  },
  {
    id: "ethics_and_scope",
    number: 5,
    title: "الأسلوب الأخلاقي + المحتوى العقاري فقط",
    description:
      "الالتزام بالأسلوب الأخلاقي، ورفض أي موضوع خارج نطاق العقار السعودي مع رسالة اعتذار محددة.",
    source:
      "Internal: supabase/functions/wasata-ai-chat/index.ts → القواعد الذهبية الخمس (#5)",
  },
];

type VisibilityMap = Record<string, boolean>;

function readVisibility(): VisibilityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Object.fromEntries(GOLDEN_RULES.map((r) => [r.id, true]));
    const parsed = JSON.parse(raw) as VisibilityMap;
    // ضمان وجود مفاتيح لكل القواعد
    return Object.fromEntries(
      GOLDEN_RULES.map((r) => [r.id, parsed[r.id] !== false])
    );
  } catch {
    return Object.fromEntries(GOLDEN_RULES.map((r) => [r.id, true]));
  }
}

function writeVisibility(v: VisibilityMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
}

const AIAssistantSettingsPage: React.FC = () => {
  const [visibility, setVisibility] = React.useState<VisibilityMap>(() =>
    readVisibility()
  );

  const toggleRule = (id: string) => {
    const next = { ...visibility, [id]: !visibility[id] };
    setVisibility(next);
    writeVisibility(next);
  };

  const visibleRules = GOLDEN_RULES.filter((r) => visibility[r.id]);

  return (
    <OwnerDashboardLayout
      title="إعدادات المساعد الذكي"
      icon={<Sparkles className="w-5 h-5 text-[#D4AF37]" />}
    >
      <div className="space-y-6">
        {/* مقدمة */}
        <Card className="border-2 border-[#01411C]/20">
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-[#01411C] mb-2">
              القواعد الذهبية الخمس لوساطه AI
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              هذه هي القواعد المطبَّقة حرفياً في برومبت المساعد الذكي. لا يمكن
              للمستخدم العادي رؤية هذه الصفحة — للمالك فقط. التبديل هنا يتحكم
              فقط بإظهار القاعدة في هذه اللوحة، ولا يُعدِّل منطق المساعد.
            </p>
          </CardContent>
        </Card>

        {/* قائمة القواعد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOLDEN_RULES.map((rule) => {
            const isOn = visibility[rule.id];
            return (
              <Card
                key={rule.id}
                className={`border-2 transition-all ${
                  isOn
                    ? "border-[#D4AF37]/60 bg-white"
                    : "border-gray-200 bg-gray-50 opacity-70"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className="bg-[#01411C] text-white shrink-0">
                        #{rule.number}
                      </Badge>
                      <h3 className="font-bold text-[#01411C] truncate">
                        {rule.title}
                      </h3>
                    </div>
                    <Switch
                      checked={isOn}
                      onCheckedChange={() => toggleRule(rule.id)}
                      aria-label={`تبديل عرض القاعدة ${rule.number}`}
                    />
                  </div>

                  {isOn && (
                    <>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {rule.description}
                      </p>
                      <div className="text-[11px] text-gray-500 border-t pt-2 leading-relaxed">
                        <span className="font-semibold text-[#01411C]">
                          المرجع:
                        </span>{" "}
                        {rule.source}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ملخص */}
        <Card className="border border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-4 text-sm text-gray-600">
            <span className="font-semibold text-[#01411C]">
              القواعد المعروضة حالياً:
            </span>{" "}
            {visibleRules.length} من {GOLDEN_RULES.length}
          </CardContent>
        </Card>
      </div>
    </OwnerDashboardLayout>
  );
};

export default AIAssistantSettingsPage;
