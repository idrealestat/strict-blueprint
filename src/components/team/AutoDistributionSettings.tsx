/**
 * AutoDistributionSettings.tsx
 * إعدادات التوزيع التلقائي للعملاء على أعضاء الفريق
 * يُحفظ الوضع في sessionStorage حالياً (وفي team_settings.lead_distribution_mode إن وُجد العمود)
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shuffle, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

const MODES = [
  { value: 'manual', label: 'يدوي (المسؤول يعيّن العملاء)' },
  { value: 'round_robin', label: 'بالتناوب (روبن)' },
  { value: 'least_loaded', label: 'الأقل ضغطاً' },
  { value: 'random', label: 'عشوائي' },
];

const LOCAL_KEY = 'wasata_lead_distribution_mode';

export default function AutoDistributionSettings() {
  const { user } = useAuthContext();
  const [mode, setMode] = useState<string>('manual');
  const [initialMode, setInitialMode] = useState<string>('manual');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        const { data } = await (supabase as any)
          .from('team_settings')
          .select('lead_distribution_mode')
          .eq('organization_user_id', user.id)
          .maybeSingle();
        const remote = data?.lead_distribution_mode;
        if (remote) {
          setMode(remote);
          setInitialMode(remote);
          return;
        }
      } catch {
        // العمود قد لا يكون موجوداً في types، نتجاهل
      }
      const local = sessionStorage.getItem(LOCAL_KEY) || 'manual';
      setMode(local);
      setInitialMode(local);
    })();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await (supabase as any)
        .from('team_settings')
        .update({ lead_distribution_mode: mode })
        .eq('organization_user_id', user.id);
      sessionStorage.setItem(LOCAL_KEY, mode);
      setInitialMode(mode);
      toast.success('تم حفظ وضع التوزيع');
    } catch (e: any) {
      sessionStorage.setItem(LOCAL_KEY, mode);
      setInitialMode(mode);
      toast.success('تم حفظ وضع التوزيع محلياً');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = mode !== initialMode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shuffle className="w-4 h-4 text-[#01411C]" />
          توزيع العملاء التلقائي
        </CardTitle>
        <CardDescription>
          اختر كيف يتم توزيع العملاء الجدد على أعضاء فريقك تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>وضع التوزيع</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            عند اختيار غير "يدوي"، يقوم النظام بإسناد كل عميل جديد تلقائياً حسب القاعدة المختارة.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full bg-[#01411C] hover:bg-[#012d14]"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الحفظ...</>
          ) : (
            <><Save className="w-4 h-4 ml-2" /> حفظ وضع التوزيع</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
