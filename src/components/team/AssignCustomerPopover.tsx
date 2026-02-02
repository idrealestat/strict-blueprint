/**
 * AssignCustomerPopover.tsx
 * قائمة منبثقة لتعيين عميل لزميل - تظهر مباشرة تحت الزر
 */

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Shield,
  User,
  Loader2,
  Users,
  ChevronRight,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import { useSharedCustomers } from '@/hooks/useSharedCustomers';
import { useAuthContext } from '@/context/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

interface AssignCustomerPopoverProps {
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
  children: React.ReactNode;
}

const ROLE_CONFIG = {
  admin: { label: 'مسؤول', icon: Crown, color: 'text-amber-600 bg-amber-100' },
  manager: { label: 'مدير', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  member: { label: 'فرد', icon: User, color: 'text-gray-600 bg-gray-100' },
};

export default function AssignCustomerPopover({
  customerId,
  customerName,
  onSuccess,
  children,
}: AssignCustomerPopoverProps) {
  const { user } = useAuthContext();
  const { currentUser } = useCurrentUser();
  const { members, isLoading: membersLoading } = useTeamManagement();
  const { assignCustomerToMember } = useSharedCustomers(user?.id);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'list' | 'note'>('list');
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فلترة الأعضاء النشطين
  const activeMembers = members.filter(
    (m) => m.status === 'active' && m.member_user_id && m.member_user_id !== user?.id
  );

  // اسم المسؤول الحالي
  const currentUserName = currentUser?.name || currentUser?.companyName || 'المسؤول';

  const handleSelectMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setStep('note');
  };

  const handleBack = () => {
    setStep('list');
    setSelectedMember(null);
    setNotes('');
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
    setIsOpen(false);
    setSelectedMember(null);
    setNotes('');
    setStep('list');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 z-50 bg-white shadow-xl border rounded-xl overflow-hidden" 
        dir="rtl"
        align="start"
        sideOffset={4}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b bg-gradient-to-l from-[#01411C]/10 to-white">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#01411C]" />
            <span className="text-sm font-bold text-gray-800">
              {step === 'list' ? 'اختر زميلاً' : 'أضف ملاحظة'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            👤 {customerName}
          </p>
        </div>

        {/* قائمة الزملاء */}
        {step === 'list' && (
          <ScrollArea className="max-h-[220px]">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="text-center py-6 px-3">
                <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-600">لا يوجد زملاء</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  أضف زملاء من إدارة الفريق
                </p>
              </div>
            ) : (
              <div className="py-1">
                {activeMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.member_role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
                  const RoleIcon = roleConfig.icon;

                  return (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#01411C]/5 transition-colors text-right group"
                    >
                      <Avatar className="w-8 h-8 shrink-0 border border-gray-200">
                        <AvatarFallback className={roleConfig.color}>
                          <RoleIcon className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[#01411C] transition-colors">
                          {member.member_name || 'غير معروف'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {roleConfig.label}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#01411C] transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {/* إضافة ملاحظة */}
        {step === 'note' && selectedMember && (
          <div className="p-3 space-y-3">
            {/* الزميل المختار */}
            <div className="flex items-center gap-2 p-2 bg-[#01411C]/5 rounded-lg">
              <Avatar className="w-7 h-7 border border-[#01411C]/30">
                <AvatarFallback className={ROLE_CONFIG[selectedMember.member_role as keyof typeof ROLE_CONFIG]?.color || 'bg-gray-100'}>
                  {(() => {
                    const Icon = ROLE_CONFIG[selectedMember.member_role as keyof typeof ROLE_CONFIG]?.icon || User;
                    return <Icon className="w-3 h-3" />;
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#01411C] truncate">{selectedMember.member_name}</p>
              </div>
              <button
                onClick={handleBack}
                className="text-[10px] text-gray-500 hover:text-[#01411C]"
              >
                تغيير
              </button>
            </div>

            {/* حقل الملاحظة */}
            <div>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظة للزميل (اختياري)..."
                className="text-sm h-9"
              />
              <p className="text-[9px] text-gray-400 mt-1">
                تظهر مع اسمك في الإشعار
              </p>
            </div>

            {/* أزرار */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex-1 h-8 text-xs"
              >
                <ArrowRight className="w-3 h-3 ml-1" />
                رجوع
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-8 text-xs bg-[#01411C] hover:bg-[#01411C]/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 ml-1" />
                    تعيين
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
