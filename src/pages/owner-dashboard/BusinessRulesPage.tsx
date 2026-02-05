/**
 * BusinessRulesPage.tsx
 * صفحة قواعد حسابات الأعمال (Layer 3)
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { 
  FEATURE_FLAG_KEYS, 
  FEATURE_FLAG_LABELS, 
  FeatureFlags 
} from "@/context/FeatureFlagsContext";

interface GlobalDefaults {
  id: string;
  [key: string]: boolean | string | null;
}

interface BusinessRule {
  id: string;
  account_type: string;
  notes: string | null;
  [key: string]: boolean | string | null;
}

const BusinessRulesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults | null>(null);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: globalData } = await supabase
        .from('global_feature_defaults')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setGlobalDefaults(globalData);

      const { data: businessData } = await supabase
        .from('business_feature_rules')
        .select('*');
      
      setBusinessRules(businessData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBusinessRuleChange = async (accountType: string, key: string, value: boolean | null) => {
    try {
      const { error } = await supabase
        .from('business_feature_rules')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('account_type', accountType);

      if (error) throw error;

      setBusinessRules(prev => prev.map(r => 
        r.account_type === accountType ? { ...r, [key]: value } : r
      ));
      
      toast.success('تم تحديث قاعدة الأعمال');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // Feature Toggle Row with Tri-State
  const FeatureToggleRow = ({ 
    flagKey, 
    value, 
    globalValue,
    onChange,
  }: { 
    flagKey: keyof FeatureFlags;
    value: boolean | null | undefined;
    globalValue?: boolean;
    onChange: (value: boolean | null) => void;
  }) => {
    const isDifferent = value !== null && value !== undefined && value !== globalValue;
    const currentState = value === null || value === undefined ? 'global' : (value ? 'enabled' : 'disabled');
    
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-all">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{FEATURE_FLAG_LABELS[flagKey]}</span>
          {isDifferent && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
              مختلف
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentState} onValueChange={(v) => {
            if (v === 'global') onChange(null);
            else if (v === 'enabled') onChange(true);
            else onChange(false);
          }}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <span className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  اتباع العام
                </span>
              </SelectItem>
              <SelectItem value="enabled">
                <span className="flex items-center gap-2 text-green-600">
                  <Check className="w-3 h-3" />
                  مفعّل
                </span>
              </SelectItem>
              <SelectItem value="disabled">
                <span className="flex items-center gap-2 text-red-600">
                  <X className="w-3 h-3" />
                  معطّل
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <OwnerDashboardLayout
      title="قواعد الأعمال"
      icon={<Building2 className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#01411C]" />
            قواعد حسابات الأعمال (Layer 3)
          </CardTitle>
          <CardDescription>
            تحكم في الميزات الخاصة بحسابات المكاتب والشركات. تطبق فقط عندما لا يوجد استثناء للمستخدم.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {businessRules.map(rule => (
            <div key={rule.id} className="space-y-4">
              <div className="flex items-center gap-2">
                {rule.account_type === 'office' ? (
                  <Building2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Building2 className="w-5 h-5 text-purple-600" />
                )}
                <h4 className="font-bold">
                  {rule.account_type === 'office' ? 'المكاتب العقارية' : 'الشركات'}
                </h4>
              </div>
              
              <div className="border rounded-lg p-3 space-y-1">
                {FEATURE_FLAG_KEYS.map(key => (
                  <FeatureToggleRow
                    key={key}
                    flagKey={key}
                    value={rule[key] as boolean | null}
                    globalValue={globalDefaults?.[key] as boolean}
                    onChange={(v) => handleBusinessRuleChange(rule.account_type, key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </OwnerDashboardLayout>
  );
};

export default BusinessRulesPage;
