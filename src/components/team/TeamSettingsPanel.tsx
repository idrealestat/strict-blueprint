/**
 * TeamSettingsPanel.tsx
 * لوحة إعدادات الفريق
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Eye,
  TrendingUp,
  Bell,
  Clock,
  Home,
  Shield,
  Info,
  Save,
  Loader2,
} from 'lucide-react';
import { useTeamManagement, type TeamSettings } from '@/hooks/useTeamManagement';
import { toast } from 'sonner';

export default function TeamSettingsPanel() {
  const { settings, isLoading, updateTeamSettings } = useTeamManagement();
  const [localSettings, setLocalSettings] = useState<Partial<TeamSettings> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        share_customers_enabled: settings.share_customers_enabled,
        customer_visibility: settings.customer_visibility,
        smart_opportunities_rotation: settings.smart_opportunities_rotation,
        opportunity_timeout_hours: settings.opportunity_timeout_hours,
        require_approval_for_publishing: settings.require_approval_for_publishing,
        notify_admin_on_customer_add: settings.notify_admin_on_customer_add,
        notify_admin_on_opportunity_action: settings.notify_admin_on_opportunity_action,
        notify_admin_on_property_publish: settings.notify_admin_on_property_publish,
      });
    }
  }, [settings]);

  const handleChange = <K extends keyof TeamSettings>(
    key: K,
    value: TeamSettings[K]
  ) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      const success = await updateTeamSettings(localSettings);
      if (success) {
        setHasChanges(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer Sharing Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-blue-600" />
            إعدادات مشاركة العملاء
          </CardTitle>
          <CardDescription>
            تحكم في كيفية مشاركة العملاء بين أعضاء الفريق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل مشاركة العملاء</Label>
              <p className="text-xs text-gray-500">
                السماح للزملاء برؤية عملاء بعضهم البعض
              </p>
            </div>
            <Switch
              checked={localSettings.share_customers_enabled}
              onCheckedChange={(v) => handleChange('share_customers_enabled', v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>نطاق الرؤية</Label>
            <Select
              value={localSettings.customer_visibility}
              onValueChange={(v) =>
                handleChange('customer_visibility', v as TeamSettings['customer_visibility'])
              }
              disabled={!localSettings.share_customers_enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    خاص - كل زميل يرى عملائه فقط
                  </div>
                </SelectItem>
                <SelectItem value="shared">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    مشترك - الجميع يرى جميع العملاء
                  </div>
                </SelectItem>
                <SelectItem value="admin_only">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    المسؤولين فقط - المسؤولين يرون الجميع
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Smart Opportunities Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-green-600" />
            إعدادات الفرص الذكية
          </CardTitle>
          <CardDescription>
            تحكم في كيفية توزيع الفرص بين الزملاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تدوير الفرص تلقائياً</Label>
              <p className="text-xs text-gray-500">
                إذا رفض زميل فرصة، تنتقل للزميل التالي
              </p>
            </div>
            <Switch
              checked={localSettings.smart_opportunities_rotation}
              onCheckedChange={(v) => handleChange('smart_opportunities_rotation', v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              مدة انتظار الفرصة (بالساعات)
            </Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={localSettings.opportunity_timeout_hours || 24}
              onChange={(e) =>
                handleChange('opportunity_timeout_hours', parseInt(e.target.value) || 24)
              }
              disabled={!localSettings.smart_opportunities_rotation}
              className="w-32"
            />
            <p className="text-xs text-gray-500">
              بعد هذه المدة، تنتقل الفرصة للزميل التالي إذا لم يتم الرد
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="w-5 h-5 text-purple-600" />
            إعدادات النشر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>اشتراط موافقة للنشر</Label>
              <p className="text-xs text-gray-500">
                يجب موافقة المسؤول قبل نشر أي عقار
              </p>
            </div>
            <Switch
              checked={localSettings.require_approval_for_publishing}
              onCheckedChange={(v) => handleChange('require_approval_for_publishing', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-amber-600" />
            إعدادات الإشعارات
          </CardTitle>
          <CardDescription>
            تنبيهات للمسؤولين عند أنشطة الفريق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>إشعار عند إضافة عميل</Label>
            <Switch
              checked={localSettings.notify_admin_on_customer_add}
              onCheckedChange={(v) => handleChange('notify_admin_on_customer_add', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>إشعار عند قبول/رفض فرصة</Label>
            <Switch
              checked={localSettings.notify_admin_on_opportunity_action}
              onCheckedChange={(v) => handleChange('notify_admin_on_opportunity_action', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>إشعار عند نشر عقار</Label>
            <Switch
              checked={localSettings.notify_admin_on_property_publish}
              onCheckedChange={(v) => handleChange('notify_admin_on_property_publish', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <Button
          className="w-full bg-[#01411C] hover:bg-[#012d14]"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}
          حفظ الإعدادات
        </Button>
      )}

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-xs">
          هذه الإعدادات تؤثر على جميع أعضاء الفريق. تأكد من إبلاغهم بأي تغييرات.
        </AlertDescription>
      </Alert>
    </div>
  );
}
