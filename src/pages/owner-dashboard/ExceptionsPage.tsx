/**
 * ExceptionsPage.tsx
 * صفحة استثناءات الأسماء الأولى
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import OwnerDashboardLayout from "./OwnerDashboardLayout";

interface FirstNameException {
  id: string;
  first_name_normalized: string;
  allowed_user_id: string | null;
  allowed_email: string | null;
  is_enabled: boolean;
  notes: string | null;
}

const ExceptionsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [exceptions, setExceptions] = useState<FirstNameException[]>([]);
  const [newException, setNewException] = useState({ name: "", notes: "" });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: exceptionsData } = await supabase
        .from('slug_firstname_exceptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      setExceptions(exceptionsData || []);
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

  const handleAddException = async () => {
    if (!newException.name.trim()) {
      toast.error('أدخل الاسم');
      return;
    }

    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .insert({
          first_name_normalized: newException.name.trim(),
          notes: newException.notes || null,
          is_enabled: true
        });

      if (error) throw error;

      toast.success('تم إضافة الاستثناء');
      setNewException({ name: "", notes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleToggleException = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
      
      setExceptions(prev => prev.map(e => 
        e.id === id ? { ...e, is_enabled: enabled } : e
      ));
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  return (
    <OwnerDashboardLayout
      title="استثناءات الأسماء"
      icon={<Shield className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#01411C]" />
            استثناءات الاسم الأول
          </CardTitle>
          <CardDescription>إدارة الأسماء المستثناة من قاعدة رفض الاسم الأول</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="الاسم الأول..."
              value={newException.name}
              onChange={(e) => setNewException((prev) => ({ ...prev, name: e.target.value }))}
              className="flex-1"
            />
            <Input
              placeholder="ملاحظات (اختياري)..."
              value={newException.notes}
              onChange={(e) => setNewException((prev) => ({ ...prev, notes: e.target.value }))}
              className="flex-1"
            />
            <Button onClick={handleAddException} className="bg-[#01411C] hover:bg-[#065f41]">
              إضافة
            </Button>
          </div>

          <div className="space-y-2">
            {exceptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                لا توجد استثناءات
              </div>
            ) : (
              exceptions.map((exception) => (
                <div key={exception.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{exception.first_name_normalized}</p>
                    {exception.notes && <p className="text-xs text-gray-500">{exception.notes}</p>}
                  </div>
                  <Switch
                    checked={exception.is_enabled}
                    onCheckedChange={(v) => handleToggleException(exception.id, v)}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </OwnerDashboardLayout>
  );
};

export default ExceptionsPage;
