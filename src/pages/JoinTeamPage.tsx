/**
 * JoinTeamPage.tsx
 * صفحة قبول دعوة الانضمام للفريق
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Shield,
  User,
  Building2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  organization_user_id: string;
  invited_name: string | null;
  invited_email: string | null;
  invited_whatsapp: string | null;
  invited_role: string;
  permissions: Record<string, boolean>;
  status: string;
  expires_at: string;
  organization_name?: string;
}

const ROLE_INFO: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  admin: {
    label: 'مسؤول',
    icon: Crown,
    color: 'text-amber-600 bg-amber-100',
  },
  manager: {
    label: 'مدير',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
  },
  member: {
    label: 'فرد',
    icon: User,
    color: 'text-gray-600 bg-gray-100',
  },
};

export default function JoinTeamPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب بيانات الدعوة
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('رابط الدعوة غير صالح');
        setIsLoading(false);
        return;
      }

      try {
        // جلب الدعوة
        const { data: invData, error: invError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('invitation_token', token)
          .single();

        if (invError || !invData) {
          setError('لم يتم العثور على الدعوة أو أنها منتهية الصلاحية');
          setIsLoading(false);
          return;
        }

        // التحقق من الحالة
        if (invData.status !== 'pending') {
          if (invData.status === 'accepted') {
            setError('تم قبول هذه الدعوة مسبقاً');
          } else if (invData.status === 'expired') {
            setError('انتهت صلاحية هذه الدعوة');
          } else {
            setError('هذه الدعوة غير متاحة');
          }
          setIsLoading(false);
          return;
        }

        // التحقق من تاريخ الانتهاء
        if (new Date(invData.expires_at) < new Date()) {
          setError('انتهت صلاحية هذه الدعوة');
          // تحديث الحالة في الداتابيس
          await supabase
            .from('team_invitations')
            .update({ status: 'expired' })
            .eq('id', invData.id);
          setIsLoading(false);
          return;
        }

        // جلب اسم المنظمة
        const { data: orgProfile } = await supabase
          .from('profiles')
          .select('company_name, full_name')
          .eq('user_id', invData.organization_user_id)
          .single();

        setInvitation({
          ...invData,
          permissions: (invData.permissions as Record<string, boolean>) || {},
          organization_name: orgProfile?.company_name || orgProfile?.full_name || 'المنظمة',
        });
      } catch (err) {
        console.error('[fetchInvitation] Error:', err);
        setError('حدث خطأ أثناء جلب بيانات الدعوة');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // قبول الدعوة
  const handleAccept = async () => {
    if (!user || !invitation) return;

    setIsAccepting(true);

    try {
      // التحقق إذا كان المستخدم عضو بالفعل
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_user_id', invitation.organization_user_id)
        .eq('member_user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast.info('أنت بالفعل عضو في هذه المنظمة');
        navigate('/app/dashboard');
        return;
      }

      // إضافة العضو
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_user_id: invitation.organization_user_id,
          member_user_id: user.id,
          member_email: invitation.invited_email,
          member_whatsapp: invitation.invited_whatsapp,
          member_name: invitation.invited_name || user.user_metadata?.full_name || user.email,
          member_role: invitation.invited_role,
          ...invitation.permissions,
          invited_by: invitation.organization_user_id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      // تحديث حالة الدعوة
      await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: user.id,
        })
        .eq('id', invitation.id);

      // إرسال إشعار للمنظمة
      await supabase.from('team_notifications').insert({
        organization_user_id: invitation.organization_user_id,
        recipient_user_id: invitation.organization_user_id,
        sender_user_id: user.id,
        notification_type: 'member_joined',
        title: 'انضمام زميل جديد',
        message: `انضم ${invitation.invited_name || 'زميل جديد'} إلى فريقك`,
        metadata: { role: invitation.invited_role },
      });

      toast.success('تم الانضمام بنجاح!');
      navigate('/app/dashboard');
    } catch (err) {
      console.error('[handleAccept] Error:', err);
      toast.error('حدث خطأ أثناء قبول الدعوة');
    } finally {
      setIsAccepting(false);
    }
  };

  // إذا لم يكن مسجل دخول
  const handleLogin = () => {
    // حفظ رابط الدعوة في localStorage للعودة بعد التسجيل
    localStorage.setItem('pendingInvitation', token || '');
    navigate('/auth');
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">الدعوة غير صالحة</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="bg-[#01411C] hover:bg-[#012d14]">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const roleInfo = ROLE_INFO[invitation.invited_role] || ROLE_INFO.member;
  const RoleIcon = roleInfo.icon;
  const expiresIn = Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-white flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#01411C]/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#01411C]" />
            </div>
            <CardTitle className="text-xl">دعوة للانضمام</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* معلومات المنظمة */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">تمت دعوتك للانضمام إلى</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{invitation.organization_name}</h3>
            </div>

            {/* الدور والصلاحيات */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الدور</span>
                <Badge className={roleInfo.color}>
                  <RoleIcon className="w-3 h-3 ml-1" />
                  {roleInfo.label}
                </Badge>
              </div>

              {invitation.invited_name && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">الاسم</span>
                  <span className="font-medium">{invitation.invited_name}</span>
                </div>
              )}
            </div>

            {/* تحذير انتهاء الصلاحية */}
            {expiresIn <= 2 && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <Clock className="w-3 h-3 inline ml-1" />
                  تنتهي صلاحية الدعوة خلال {expiresIn} {expiresIn === 1 ? 'يوم' : 'أيام'}
                </AlertDescription>
              </Alert>
            )}

            {/* الأزرار */}
            {user ? (
              <Button
                className="w-full bg-[#01411C] hover:bg-[#012d14] h-12 text-lg"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 ml-2" />
                )}
                قبول الدعوة والانضمام
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-700 text-sm">
                    يجب تسجيل الدخول أو إنشاء حساب جديد لقبول الدعوة
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full bg-[#01411C] hover:bg-[#012d14] h-12 text-lg"
                  onClick={handleLogin}
                >
                  تسجيل الدخول / إنشاء حساب
                </Button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              بقبول الدعوة، ستصبح جزءاً من فريق {invitation.organization_name} وستتمكن من الوصول للموارد المشتركة.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
