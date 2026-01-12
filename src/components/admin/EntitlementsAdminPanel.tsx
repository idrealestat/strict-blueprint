import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Users, Clock, Shield, Save, RefreshCw,
  Calendar, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UserEntitlement {
  id: string;
  user_id: string;
  plan_code: 'INDIVIDUAL' | 'OFFICE' | null;
  status: 'trial' | 'active' | 'expired';
  trial_starts_at: string;
  trial_ends_at: string;
  onboarding_completed: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface SystemSettings {
  trial_duration_hours: number;
}

export default function EntitlementsAdminPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserEntitlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({ trial_duration_hours: 720 });
  const [selectedUser, setSelectedUser] = useState<UserEntitlement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // جلب الإعدادات
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'trial_duration_hours')
        .single();

      if (data?.setting_value) {
        setSettings({ trial_duration_hours: parseInt(data.setting_value as string) || 720 });
      }
    };
    fetchSettings();
  }, []);

  // البحث عن المستخدمين
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'أدخل بريد إلكتروني أو معرف مستخدم', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .or(`user_id.eq.${searchQuery}`)
        .limit(10);

      if (error) throw error;

      // جلب بيانات المستخدمين من profiles
      const userIds = data?.map(u => u.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const enrichedData = data?.map(u => ({
        ...u,
        user_name: profiles?.find(p => p.user_id === u.user_id)?.full_name || 'غير معروف'
      })) || [];

      setUsers(enrichedData);
      
      if (enrichedData.length === 0) {
        toast({ title: 'لم يتم العثور على نتائج' });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'حدث خطأ في البحث', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث إعدادات النظام
  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: settings.trial_duration_hours.toString() })
        .eq('setting_key', 'trial_duration_hours');

      if (error) throw error;

      toast({ title: 'تم حفظ الإعدادات بنجاح' });
    } catch (error) {
      toast({ title: 'فشل حفظ الإعدادات', variant: 'destructive' });
    }
  };

  // تحديث بيانات مستخدم
  const handleUpdateUser = async (userId: string, updates: Partial<UserEntitlement>) => {
    try {
      const { error } = await supabase
        .from('user_entitlements')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, ...updates } : u
      ));

      toast({ title: 'تم تحديث بيانات المستخدم' });
    } catch (error) {
      toast({ title: 'فشل التحديث', variant: 'destructive' });
    }
  };

  // تمديد التجربة
  const handleExtendTrial = async (userId: string, days: number) => {
    try {
      const user = users.find(u => u.user_id === userId);
      if (!user) return;

      const currentEnd = new Date(user.trial_ends_at);
      const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

      await handleUpdateUser(userId, { 
        trial_ends_at: newEnd.toISOString(),
        status: 'trial'
      });
    } catch (error) {
      toast({ title: 'فشل تمديد التجربة', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* إعدادات النظام */}
      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">إعدادات النظام</CardTitle>
                    <CardDescription>تحكم في مدة التجربة والميزات</CardDescription>
                  </div>
                </div>
                {isSettingsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4 border-t pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>مدة التجربة المجانية (ساعات)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={settings.trial_duration_hours}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        trial_duration_hours: parseInt(e.target.value) || 720 
                      })}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveSettings} size="icon">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    720 ساعة = 30 يوم
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* البحث عن المستخدمين */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">إدارة المستخدمين</CardTitle>
              <CardDescription>ابحث عن مستخدم بالبريد الإلكتروني أو المعرف</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البريد الإلكتروني أو معرف المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'بحث'}
            </Button>
          </div>

          {/* نتائج البحث */}
          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.user_name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{user.user_id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                      user.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'trial' ? 'تجربة' : user.status === 'active' ? 'نشط' : 'منتهي'}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {/* الباقة */}
                    <div className="space-y-1">
                      <Label className="text-xs">الباقة</Label>
                      <Select
                        value={user.plan_code || 'none'}
                        onValueChange={(value) => handleUpdateUser(user.user_id, { 
                          plan_code: value === 'none' ? null : value as 'INDIVIDUAL' | 'OFFICE'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون باقة</SelectItem>
                          <SelectItem value="INDIVIDUAL">أفراد</SelectItem>
                          <SelectItem value="OFFICE">مكتب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* الحالة */}
                    <div className="space-y-1">
                      <Label className="text-xs">الحالة</Label>
                      <Select
                        value={user.status}
                        onValueChange={(value) => handleUpdateUser(user.user_id, { 
                          status: value as 'trial' | 'active' | 'expired'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">تجربة</SelectItem>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="expired">منتهي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* تمديد التجربة */}
                    <div className="space-y-1">
                      <Label className="text-xs">تمديد التجربة</Label>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExtendTrial(user.user_id, 7)}
                        >
                          +7 أيام
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExtendTrial(user.user_id, 30)}
                        >
                          +30 يوم
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      انتهاء التجربة: {new Date(user.trial_ends_at).toLocaleDateString('ar-SA')}
                    </span>
                    <span>
                      البطاقة: {user.onboarding_completed ? '✓ مكتملة' : '✗ غير مكتملة'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
