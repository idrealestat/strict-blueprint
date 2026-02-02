/**
 * AddColleagueDialog.tsx
 * نافذة إضافة زميل جديد - للمكاتب والشركات فقط
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  Phone,
  Mail,
  Shield,
  Crown,
  User,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Eye,
  Users,
  TrendingUp,
  Home,
} from 'lucide-react';
import { useTeamManagement, type AddMemberInput } from '@/hooks/useTeamManagement';
import { toast } from 'sonner';

interface AddColleagueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SearchMethod = 'whatsapp' | 'email';

const ROLE_INFO = {
  admin: {
    label: 'مسؤول',
    icon: Crown,
    color: 'text-amber-600 bg-amber-100',
    description: 'صلاحيات كاملة للإدارة والإشراف على جميع الزملاء',
  },
  manager: {
    label: 'مدير',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
    description: 'إدارة العملاء والنشر مع إمكانية الاطلاع على التحليلات',
  },
  member: {
    label: 'فرد',
    icon: User,
    color: 'text-gray-600 bg-gray-100',
    description: 'صلاحيات أساسية للعمل مع العملاء الخاصين به',
  },
};

export default function AddColleagueDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddColleagueDialogProps) {
  const { addMember, searchUser } = useTeamManagement();

  // حالة النموذج
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    user?: { name: string; falLicense: string; email?: string };
  } | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    whatsapp: string;
    email: string;
    falLicense: string;
    role: 'admin' | 'manager' | 'member';
    notes: string;
    permissions: {
      can_publish_properties: boolean;
      can_view_all_customers: boolean;
      can_manage_customers: boolean;
      can_view_smart_opportunities: boolean;
      can_accept_opportunities: boolean;
      can_view_analytics: boolean;
      can_manage_team: boolean;
    };
  }>({
    name: '',
    whatsapp: '',
    email: '',
    falLicense: '',
    role: 'member',
    notes: '',
    permissions: {
      can_publish_properties: true,
      can_view_all_customers: false,
      can_manage_customers: true,
      can_view_smart_opportunities: true,
      can_accept_opportunities: true,
      can_view_analytics: false,
      can_manage_team: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'search' | 'details' | 'permissions'>('search');

  // البحث عن مستخدم
  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 3) {
      toast.error('يرجى إدخال قيمة صحيحة للبحث');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await searchUser(searchQuery);
      setSearchResult(result);

      if (result.found && result.user) {
        setFormData(prev => ({
          ...prev,
          name: result.user!.name,
          falLicense: result.user!.falLicense,
          email: result.user!.email || prev.email,
          whatsapp: searchMethod === 'whatsapp' ? searchQuery : prev.whatsapp,
        }));
        setStep('details');
      }
    } catch (error) {
      console.error('[handleSearch] Error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchUser, searchMethod]);

  // تحديث الصلاحيات حسب الدور
  const handleRoleChange = (role: 'admin' | 'manager' | 'member') => {
    const defaultPerms = {
      admin: {
        can_publish_properties: true,
        can_view_all_customers: true,
        can_manage_customers: true,
        can_view_smart_opportunities: true,
        can_accept_opportunities: true,
        can_view_analytics: true,
        can_manage_team: true,
      },
      manager: {
        can_publish_properties: true,
        can_view_all_customers: true,
        can_manage_customers: true,
        can_view_smart_opportunities: true,
        can_accept_opportunities: true,
        can_view_analytics: true,
        can_manage_team: false,
      },
      member: {
        can_publish_properties: true,
        can_view_all_customers: false,
        can_manage_customers: true,
        can_view_smart_opportunities: true,
        can_accept_opportunities: true,
        can_view_analytics: false,
        can_manage_team: false,
      },
    };

    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPerms[role],
    }));
  };

  // إرسال النموذج
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الزميل');
      return;
    }

    if (!formData.whatsapp && !formData.email) {
      toast.error('يرجى إدخال رقم الواتساب أو البريد الإلكتروني');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: AddMemberInput = {
        name: formData.name,
        email: formData.email || undefined,
        whatsapp: formData.whatsapp || undefined,
        falLicense: formData.falLicense || undefined,
        role: formData.role,
        permissions: formData.permissions,
      };

      const result = await addMember(input);

      if (result.success) {
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || 'حدث خطأ أثناء الإضافة');
      }
    } catch (error) {
      console.error('[handleSubmit] Error:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setSearchQuery('');
    setSearchResult(null);
    setFormData({
      name: '',
      whatsapp: '',
      email: '',
      falLicense: '',
      role: 'member',
      notes: '',
      permissions: {
        can_publish_properties: true,
        can_view_all_customers: false,
        can_manage_customers: true,
        can_view_smart_opportunities: true,
        can_accept_opportunities: true,
        can_view_analytics: false,
        can_manage_team: false,
      },
    });
    setStep('search');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const RoleIcon = ROLE_INFO[formData.role].icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="w-5 h-5 text-[#01411C]" />
            إضافة زميل جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* خطوات الإضافة */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {['search', 'details', 'permissions'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s
                      ? 'bg-[#01411C] text-white'
                      : i < ['search', 'details', 'permissions'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      i < ['search', 'details', 'permissions'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* الخطوة 1: البحث */}
          {step === 'search' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Tabs
                value={searchMethod}
                onValueChange={(v) => setSearchMethod(v as SearchMethod)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    واتساب
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    بريد إلكتروني
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="whatsapp" className="mt-4">
                  <div className="space-y-2">
                    <Label>رقم الواتساب أو رقم رخصة فال</Label>
                    <div className="flex gap-2">
                      <Input
                        dir="ltr"
                        placeholder="+966xxxxxxxxx أو رقم رخصة فال"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 text-left"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching || searchQuery.length < 3}
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <div className="flex gap-2">
                      <Input
                        dir="ltr"
                        type="email"
                        placeholder="example@email.com"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 text-left"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching || searchQuery.length < 3}
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* نتيجة البحث */}
              {searchResult && (
                <Alert
                  className={
                    searchResult.found
                      ? 'border-green-300 bg-green-50'
                      : 'border-amber-300 bg-amber-50'
                  }
                >
                  {searchResult.found ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <AlertDescription>
                    {searchResult.found ? (
                      <div className="text-green-700">
                        <p className="font-bold">{searchResult.user?.name}</p>
                        {searchResult.user?.falLicense && (
                          <p className="text-sm">
                            رخصة فال: {searchResult.user.falLicense}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-amber-700">
                        لم يتم العثور على مستخدم مسجل. يمكنك إضافته يدوياً.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* زر المتابعة أو الإضافة اليدوية */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      whatsapp: searchMethod === 'whatsapp' ? searchQuery : '',
                      email: searchMethod === 'email' ? searchQuery : '',
                    }));
                    setStep('details');
                  }}
                >
                  إضافة يدوياً
                </Button>
                {searchResult?.found && (
                  <Button
                    className="flex-1 bg-[#01411C] hover:bg-[#012d14]"
                    onClick={() => setStep('details')}
                  >
                    متابعة
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* الخطوة 2: البيانات */}
          {step === 'details' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>اسم الزميل *</Label>
                  <Input
                    placeholder="الاسم الكامل"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>رقم الواتساب</Label>
                  <Input
                    dir="ltr"
                    placeholder="+966xxxxxxxxx"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    className="text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    dir="ltr"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label>رقم رخصة فال</Label>
                  <Input
                    dir="ltr"
                    placeholder="رقم الرخصة"
                    value={formData.falLicense}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, falLicense: e.target.value }))
                    }
                    className="text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label>نوع الحساب *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      handleRoleChange(v as 'admin' | 'manager' | 'member')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_INFO).map(([key, info]) => {
                        const Icon = info.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{info.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {ROLE_INFO[formData.role].description}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('search')}>
                  رجوع
                </Button>
                <Button
                  className="flex-1 bg-[#01411C] hover:bg-[#012d14]"
                  onClick={() => setStep('permissions')}
                  disabled={!formData.name.trim()}
                >
                  التالي: الصلاحيات
                </Button>
              </div>
            </motion.div>
          )}

          {/* الخطوة 3: الصلاحيات */}
          {step === 'permissions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <RoleIcon className={`w-6 h-6 ${ROLE_INFO[formData.role].color.split(' ')[0]}`} />
                <div>
                  <p className="font-bold">{formData.name}</p>
                  <Badge className={ROLE_INFO[formData.role].color}>
                    {ROLE_INFO[formData.role].label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">الصلاحيات</h4>

                {/* نشر العقارات */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">نشر العقارات</span>
                  </div>
                  <Switch
                    checked={formData.permissions.can_publish_properties}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_publish_properties: v },
                      }))
                    }
                  />
                </div>

                {/* عرض جميع العملاء */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">عرض جميع العملاء</span>
                  </div>
                  <Switch
                    checked={formData.permissions.can_view_all_customers}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_all_customers: v },
                      }))
                    }
                  />
                </div>

                {/* الفرص الذكية */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">الفرص الذكية</span>
                  </div>
                  <Switch
                    checked={formData.permissions.can_view_smart_opportunities}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          can_view_smart_opportunities: v,
                          can_accept_opportunities: v,
                        },
                      }))
                    }
                  />
                </div>

                {/* عرض التحليلات */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">عرض التحليلات</span>
                  </div>
                  <Switch
                    checked={formData.permissions.can_view_analytics}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_view_analytics: v },
                      }))
                    }
                  />
                </div>

                {/* إدارة الفريق */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">إدارة الفريق</span>
                  </div>
                  <Switch
                    checked={formData.permissions.can_manage_team}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, can_manage_team: v },
                      }))
                    }
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  placeholder="ملاحظات خاصة بهذا الزميل..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')}>
                  رجوع
                </Button>
                <Button
                  className="flex-1 bg-[#01411C] hover:bg-[#012d14]"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 ml-2" />
                  )}
                  إضافة الزميل
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
