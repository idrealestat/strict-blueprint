/**
 * AssignCustomerToMemberDialog.tsx
 * نافذة تعيين عميل لزميل - بالشكل الكامل مع الملاحظة
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Shield,
  User,
  Loader2,
  Users,
  UserPlus,
  Send,
  CheckCircle,
} from 'lucide-react';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import { useSharedCustomers } from '@/hooks/useSharedCustomers';
import { useAuthContext } from '@/context/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

interface AssignCustomerToMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}

const ROLE_CONFIG = {
  admin: { label: 'مسؤول', icon: Crown, color: 'text-amber-600 bg-amber-100' },
  manager: { label: 'مدير', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  member: { label: 'فرد', icon: User, color: 'text-gray-600 bg-gray-100' },
};

export default function AssignCustomerToMemberDialog({
  isOpen,
  onClose,
  customerId,
  customerName,
  onSuccess,
}: AssignCustomerToMemberDialogProps) {
  const { user } = useAuthContext();
  const { currentUser } = useCurrentUser();
  const { members, isLoading: membersLoading } = useTeamManagement();
  const { assignCustomerToMember } = useSharedCustomers(user?.id);

  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'notes'>('select');

  // فلترة الأعضاء النشطين
  const activeMembers = members.filter(
    (m) => m.status === 'active' && m.member_user_id && m.member_user_id !== user?.id
  );

  // اسم المسؤول الحالي
  const currentUserName = currentUser?.name || currentUser?.companyName || 'المسؤول';

  const handleSelectMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setStep('notes');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedMember(null);
  };

  const handleSubmit = async () => {
    if (!user || !selectedMember?.member_user_id) return;

    setIsSubmitting(true);

    try {
      const success = await assignCustomerToMember({
        customerId,
        assignToUserId: selectedMember.member_user_id,
        organizationUserId: user.id,
        notes: notes.trim() || undefined,
        senderName: currentUserName,
      });

      if (success) {
        toast.success(`تم تعيين "${customerName}" لـ ${selectedMember.member_name}`);
        onSuccess?.();
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
    setNotes('');
    setStep('select');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="w-5 h-5 text-[#01411C]" />
            تعيين عميل لزميل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* معلومات العميل */}
          <div className="p-3 bg-gradient-to-l from-blue-50 to-transparent rounded-lg border border-blue-100">
            <p className="text-sm font-medium text-blue-800">
              👤 العميل: <span className="font-bold">{customerName}</span>
            </p>
          </div>

          {/* خطوة اختيار الزميل */}
          {step === 'select' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">اختر الزميل</Label>
              
              <ScrollArea className="h-[250px] border rounded-lg">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : activeMembers.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Users className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-600">لا يوجد زملاء</p>
                    <p className="text-sm text-gray-400 mt-1">
                      أضف زملاء من إدارة الفريق أولاً
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {activeMembers.map((member) => {
                      const roleConfig = ROLE_CONFIG[member.member_role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
                      const RoleIcon = roleConfig.icon;

                      return (
                        <button
                          key={member.id}
                          onClick={() => handleSelectMember(member)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#01411C]/5 transition-colors text-right group border border-transparent hover:border-[#01411C]/20"
                        >
                          <Avatar className="w-10 h-10 shrink-0 border-2 border-gray-200">
                            <AvatarFallback className={roleConfig.color}>
                              <RoleIcon className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 group-hover:text-[#01411C] transition-colors">
                              {member.member_name || 'غير معروف'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] px-1.5 py-0 ${roleConfig.color}`}
                              >
                                {roleConfig.label}
                              </Badge>
                              {member.member_fal_license && (
                                <span className="text-xs text-gray-400">
                                  فال: {member.member_fal_license}
                                </span>
                              )}
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-gray-300 group-hover:text-[#01411C] transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* خطوة إضافة الملاحظة */}
          {step === 'notes' && selectedMember && (
            <div className="space-y-4">
              {/* الزميل المختار */}
              <div className="p-3 bg-[#01411C]/5 rounded-lg border border-[#01411C]/20">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-[#01411C]/30">
                    <AvatarFallback className={ROLE_CONFIG[selectedMember.member_role as keyof typeof ROLE_CONFIG]?.color || 'bg-gray-100'}>
                      {(() => {
                        const Icon = ROLE_CONFIG[selectedMember.member_role as keyof typeof ROLE_CONFIG]?.icon || User;
                        return <Icon className="w-4 h-4" />;
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-[#01411C]">{selectedMember.member_name}</p>
                    <p className="text-xs text-gray-500">
                      {ROLE_CONFIG[selectedMember.member_role as keyof typeof ROLE_CONFIG]?.label || 'فرد'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-xs"
                  >
                    تغيير
                  </Button>
                </div>
              </div>

              {/* حقل الملاحظة */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  ملاحظة للزميل <span className="text-gray-400">(اختياري)</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب ملاحظة أو تعليمات للزميل حول هذا العميل..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400">
                  ستظهر هذه الملاحظة في الإشعار المُرسل للزميل مع اسمك.
                </p>
              </div>

              {/* معاينة الإشعار */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1">معاينة الإشعار:</p>
                <p className="text-sm text-amber-900">
                  قام <span className="font-bold">{currentUserName}</span> بتعيين العميل "{customerName}" لك
                  {notes.trim() && (
                    <>
                      <br />
                      <span className="text-amber-700">📝 ملاحظة: {notes}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* الأزرار */}
        {step === 'notes' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              رجوع
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedMember}
              className="flex-1 bg-[#01411C] hover:bg-[#01411C]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التعيين...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  تعيين العميل
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
