/**
 * AddColleagueDialog.tsx
 * نافذة إضافة زميل جديد - للمكاتب والشركات فقط
 * يدعم البحث عن مستخدم موجود أو إرسال رابط دعوة
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Eye,
  Users,
  TrendingUp,
  Home,
  Send,
  Link,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { useTeamManagement, type AddMemberInput } from '@/hooks/useTeamManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AddColleagueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SearchMethod = 'whatsapp' | 'email';
type AddMethod = 'search' | 'invite';

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

// الحصول على رابط الدعوة
const getInvitationUrl = (token: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/join/${token}`;
};

export default function AddColleagueDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddColleagueDialogProps) {
  const { user } = useAuthContext();
  const { addMember, searchUser } = useTeamManagement();

  // طريقة الإضافة
  const [addMethod, setAddMethod] = useState<AddMethod>('invite');
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
  const [step, setStep] = useState<'method' | 'search' | 'details' | 'permissions' | 'invite-sent'>('method');
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

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

  // إنشاء رابط الدعوة
  const createInvitation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          organization_user_id: user.id,
          invited_name: formData.name || null,
          invited_email: formData.email || null,
          invited_whatsapp: formData.whatsapp || null,
          invited_fal_license: formData.falLicense || null,
          invited_role: formData.role,
          permissions: formData.permissions,
          notes: formData.notes || null,
          invited_by: user.id,
        })
        .select('invitation_token')
        .single();

      if (error) throw error;
      
      return getInvitationUrl(data.invitation_token);
    } catch (error) {
      console.error('[createInvitation] Error:', error);
      toast.error('حدث خطأ أثناء إنشاء الدعوة');
      return null;
    }
  };

  // إرسال الدعوة عبر الواتساب
  const sendViaWhatsApp = async () => {
    if (!formData.whatsapp) {
      toast.error('يرجى إدخال رقم الواتساب');
      return;
    }

    setIsSubmitting(true);
    try {
      const link = await createInvitation();
      if (!link) return;

      setInvitationLink(link);

      // فتح الواتساب
      const message = encodeURIComponent(
        `مرحباً ${formData.name || ''}\n\nتمت دعوتك للانضمام كزميل في فريقنا.\n\nللانضمام، اضغط على الرابط:\n${link}\n\nملاحظة: الرابط صالح لمدة 7 أيام.`
      );
      const phone = formData.whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      
      setStep('invite-sent');
      toast.success('تم إنشاء الدعوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // إرسال الدعوة عبر الإيميل
  const sendViaEmail = async () => {
    if (!formData.email) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsSubmitting(true);
    try {
      const link = await createInvitation();
      if (!link) return;

      setInvitationLink(link);

      // فتح برنامج البريد
      const subject = encodeURIComponent('دعوة للانضمام كزميل');
      const body = encodeURIComponent(
        `مرحباً ${formData.name || ''}\n\nتمت دعوتك للانضمام كزميل في فريقنا.\n\nللانضمام، اضغط على الرابط:\n${link}\n\nملاحظة: الرابط صالح لمدة 7 أيام.`
      );
      window.open(`mailto:${formData.email}?subject=${subject}&body=${body}`, '_blank');
      
      setStep('invite-sent');
      toast.success('تم إنشاء الدعوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // نسخ الرابط
  const copyLink = async () => {
    if (!invitationLink) {
      const link = await createInvitation();
      if (link) {
        setInvitationLink(link);
        navigator.clipboard.writeText(link);
        toast.success('تم نسخ رابط الدعوة');
      }
    } else {
      navigator.clipboard.writeText(invitationLink);
      toast.success('تم نسخ رابط الدعوة');
    }
  };

  // إرسال النموذج (للإضافة المباشرة)
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
    setInvitationLink(null);
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
    setStep('method');
    setAddMethod('invite');
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
          {/* اختيار طريقة الإضافة */}
          {step === 'method' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 text-center">
                كيف تريد إضافة زميل جديد؟
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* إرسال رابط دعوة */}
                <button
                  onClick={() => {
                    setAddMethod('invite');
                    setStep('details');
                  }}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${
                    addMethod === 'invite'
                      ? 'border-[#01411C] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#01411C]/10">
                      <Send className="w-5 h-5 text-[#01411C]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">إرسال رابط دعوة</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        أرسل رابط دعوة عبر الواتساب أو الإيميل. يسجل الزميل ويُضاف تلقائياً.
                      </p>
                    </div>
                  </div>
                </button>

                {/* البحث عن مستخدم موجود */}
                <button
                  onClick={() => {
                    setAddMethod('search');
                    setStep('search');
                  }}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${
                    addMethod === 'search'
                      ? 'border-[#01411C] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">البحث عن مستخدم موجود</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        ابحث عن زميل لديه حساب بالفعل وأضفه مباشرة.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* خطوة البحث */}
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
                      <div className="text-amber-700">
                        <p>لم يتم العثور على مستخدم مسجل.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              whatsapp: searchMethod === 'whatsapp' ? searchQuery : '',
                              email: searchMethod === 'email' ? searchQuery : '',
                            }));
                            setStep('details');
                          }}
                        >
                          <Send className="w-3 h-3 ml-1" />
                          إرسال رابط دعوة بدلاً من ذلك
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* أزرار */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('method')}>
                  رجوع
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

          {/* خطوة البيانات */}
          {step === 'details' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>اسم الزميل</Label>
                  <Input
                    placeholder="الاسم الكامل (اختياري للدعوة)"
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
                  <Label>رقم رخصة فال (اختياري)</Label>
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
                <Button variant="outline" onClick={() => setStep('method')}>
                  رجوع
                </Button>
                <Button
                  className="flex-1 bg-[#01411C] hover:bg-[#012d14]"
                  onClick={() => setStep('permissions')}
                  disabled={!formData.whatsapp && !formData.email}
                >
                  التالي: الصلاحيات
                </Button>
              </div>
            </motion.div>
          )}

          {/* خطوة الصلاحيات */}
          {step === 'permissions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                <RoleIcon className={`w-6 h-6 ${ROLE_INFO[formData.role].color.split(' ')[0]}`} />
                <div>
                  <p className="font-bold">{formData.name || 'زميل جديد'}</p>
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

              {/* أزرار الإرسال */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold">إرسال الدعوة عبر:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={sendViaWhatsApp}
                    disabled={isSubmitting || !formData.whatsapp}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <MessageCircle className="w-4 h-4 ml-2" />
                    )}
                    واتساب
                  </Button>
                  <Button
                    onClick={sendViaEmail}
                    disabled={isSubmitting || !formData.email}
                    variant="outline"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <Mail className="w-4 h-4 ml-2" />
                    )}
                    إيميل
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={copyLink}
                  disabled={isSubmitting}
                >
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ رابط الدعوة فقط
                </Button>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStep('details')}>
                  رجوع
                </Button>
                {addMethod === 'search' && searchResult?.found && (
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
                    إضافة مباشرة
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* تم إرسال الدعوة */}
          {step === 'invite-sent' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-6"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">تم إرسال الدعوة!</h3>
              <p className="text-sm text-gray-600">
                سيتمكن الزميل من الانضمام عند الضغط على الرابط وتسجيل حساب جديد أو تسجيل الدخول.
              </p>

              {invitationLink && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">رابط الدعوة:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      dir="ltr"
                      value={invitationLink}
                      readOnly
                      className="text-xs text-left"
                    />
                    <Button size="icon" variant="outline" onClick={copyLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    resetForm();
                  }}
                >
                  إضافة زميل آخر
                </Button>
                <Button
                  className="flex-1 bg-[#01411C] hover:bg-[#012d14]"
                  onClick={handleClose}
                >
                  تم
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
