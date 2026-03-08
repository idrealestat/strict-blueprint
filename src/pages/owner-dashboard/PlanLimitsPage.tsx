/**
 * PlanLimitsPage.tsx
 * صفحة إدارة حدود الباقات - الفرص الذكية وأقسام منصتي
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Sparkles, MapPin, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OwnerDashboardLayout from "./OwnerDashboardLayout";

interface PlanLimit {
  id: string;
  account_type: string;
  plan_tier: number;
  plan_name: string;
  daily_opportunities: number;
  daily_opportunities_trained: number;
  max_cities: number;
  max_districts: number;
  max_cities_trained: number;
  max_districts_trained: number;
  notes: string | null;
}

const ACCOUNT_TYPES = [
  { key: 'individual', label: 'أفراد', icon: '👤', color: 'from-blue-500 to-blue-600' },
  { key: 'office', label: 'مكاتب', icon: '🏢', color: 'from-emerald-500 to-emerald-600' },
  { key: 'company', label: 'شركات', icon: '🏗️', color: 'from-purple-500 to-purple-600' },
];

const PlanLimitsPage: React.FC = () => {
  const [limits, setLimits] = useState<PlanLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_limits')
      .select('*')
      .order('account_type')
      .order('plan_tier');

    if (error) {
      toast.error('خطأ في جلب البيانات');
      console.error(error);
    } else {
      setLimits((data as any[]) || []);
    }
    setLoading(false);
  };

  const updateField = (id: string, field: string, value: number | string) => {
    setLimits(prev => prev.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const limit of limits) {
        const { error } = await supabase
          .from('plan_limits')
          .update({
            plan_name: limit.plan_name,
            daily_opportunities: limit.daily_opportunities,
            daily_opportunities_trained: limit.daily_opportunities_trained,
            max_cities: limit.max_cities,
            max_districts: limit.max_districts,
            max_cities_trained: limit.max_cities_trained,
            max_districts_trained: limit.max_districts_trained,
            notes: limit.notes,
          })
          .eq('id', limit.id);

        if (error) throw error;
      }
      toast.success('تم حفظ الحدود بنجاح ✅');
    } catch (error) {
      console.error(error);
      toast.error('خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const getLimitsForType = (accountType: string) => 
    limits.filter(l => l.account_type === accountType).sort((a, b) => a.plan_tier - b.plan_tier);

  if (loading) {
    return (
      <OwnerDashboardLayout title="حدود الباقات" icon={<Sparkles className="w-5 h-5" />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </OwnerDashboardLayout>
    );
  }

  return (
    <OwnerDashboardLayout title="حدود الباقات" icon={<Sparkles className="w-5 h-5" />}>
      <div className="space-y-6">
        {/* زر الحفظ */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-[#01411C] hover:bg-[#01411C]/90 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ جميع التغييرات
          </Button>
        </div>

        <Tabs defaultValue="individual" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {ACCOUNT_TYPES.map(type => (
              <TabsTrigger key={type.key} value={type.key} className="gap-2">
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {ACCOUNT_TYPES.map(type => (
            <TabsContent key={type.key} value={type.key}>
              <div className="space-y-6">
                {getLimitsForType(type.key).map((limit) => (
                  <Card key={limit.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardHeader className={`bg-gradient-to-r ${type.color} text-white rounded-t-lg`}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>الباقة {limit.plan_tier}</span>
                        </div>
                        <Input
                          value={limit.plan_name}
                          onChange={(e) => updateField(limit.id, 'plan_name', e.target.value)}
                          className="w-40 bg-white/20 border-white/30 text-white placeholder:text-white/70 text-center"
                          dir="rtl"
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* الفرص الذكية */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-base font-bold text-foreground">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          <span>الفرص الذكية اليومية</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">العادي</Label>
                            <Input
                              type="number"
                              min={1}
                              value={limit.daily_opportunities}
                              onChange={(e) => updateField(limit.id, 'daily_opportunities', parseInt(e.target.value) || 0)}
                              className="text-center text-lg font-bold"
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-green-600" />
                              <span className="text-green-700">بعد التدريب</span>
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={limit.daily_opportunities_trained}
                              onChange={(e) => updateField(limit.id, 'daily_opportunities_trained', parseInt(e.target.value) || 0)}
                              className="text-center text-lg font-bold border-green-300 focus:ring-green-500"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>

                      {/* أقسام منصتي */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-base font-bold text-foreground">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span>أقسام منصتي</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Badge variant="outline" className="w-full justify-center py-1">العادي</Badge>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">عدد المدن</Label>
                              <Input
                                type="number"
                                min={1}
                                value={limit.max_cities}
                                onChange={(e) => updateField(limit.id, 'max_cities', parseInt(e.target.value) || 0)}
                                className="text-center font-bold"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">عدد الأحياء</Label>
                              <Input
                                type="number"
                                min={1}
                                value={limit.max_districts}
                                onChange={(e) => updateField(limit.id, 'max_districts', parseInt(e.target.value) || 0)}
                                className="text-center font-bold"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Badge variant="outline" className="w-full justify-center py-1 border-green-300 text-green-700">
                              <GraduationCap className="w-3 h-3 ml-1" />
                              بعد التدريب
                            </Badge>
                            <div className="space-y-2">
                              <Label className="text-xs text-green-700">عدد المدن</Label>
                              <Input
                                type="number"
                                min={1}
                                value={limit.max_cities_trained}
                                onChange={(e) => updateField(limit.id, 'max_cities_trained', parseInt(e.target.value) || 0)}
                                className="text-center font-bold border-green-300"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-green-700">عدد الأحياء</Label>
                              <Input
                                type="number"
                                min={1}
                                value={limit.max_districts_trained}
                                onChange={(e) => updateField(limit.id, 'max_districts_trained', parseInt(e.target.value) || 0)}
                                className="text-center font-bold border-green-300"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ملاحظات */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">ملاحظات</Label>
                        <Input
                          value={limit.notes || ''}
                          onChange={(e) => updateField(limit.id, 'notes', e.target.value)}
                          placeholder="ملاحظات اختيارية..."
                          dir="rtl"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </OwnerDashboardLayout>
  );
};

export default PlanLimitsPage;
