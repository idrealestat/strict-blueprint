/**
 * ChangelogPage.tsx
 * صفحة سجل التغييرات
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { FEATURE_FLAG_LABELS, FeatureFlags } from "@/context/FeatureFlagsContext";

interface ChangeLogEntry {
  id: string;
  feature_key: string;
  old_value: boolean | null;
  new_value: boolean | null;
  change_type: string;
  target_account_type: string | null;
  created_at: string;
}

const ChangelogPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings_change_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setChangeLog(data || []);
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

  return (
    <OwnerDashboardLayout
      title="سجل التغييرات"
      icon={<History className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#01411C]" />
            سجل التغييرات
          </CardTitle>
          <CardDescription>تتبع جميع التعديلات على الإعدادات</CardDescription>
        </CardHeader>
        <CardContent>
          {changeLog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد تغييرات مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {changeLog.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${
                    log.new_value ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.new_value ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-medium">
                        {FEATURE_FLAG_LABELS[log.feature_key as keyof FeatureFlags] || log.feature_key}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.change_type === "global_default" && "إعداد عام"}
                      {log.change_type === "user_override" && "استثناء مستخدم"}
                      {log.change_type === "business_rule" && "قاعدة أعمال"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                    <span>
                      {log.old_value !== null ? (
                        <span className={log.old_value ? "text-green-600" : "text-red-600"}>
                          {log.old_value ? "مفعّل" : "معطّل"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {" "}→{" "}
                      <span className={log.new_value ? "text-green-600" : "text-red-600"}>
                        {log.new_value ? "مفعّل" : "معطّل"}
                      </span>
                    </span>
                    <span className="text-gray-400">
                      {new Date(log.created_at).toLocaleString("ar-SA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {log.target_account_type && (
                    <div className="mt-1 text-xs text-gray-500">نوع الحساب: {log.target_account_type}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </OwnerDashboardLayout>
  );
};

export default ChangelogPage;
