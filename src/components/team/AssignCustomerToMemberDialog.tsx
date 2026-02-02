/**
 * AssignCustomerToMemberDialog.tsx
 * قائمة منبثقة صغيرة لتعيين عميل لزميل - تظهر للمسؤولين في إدارة العملاء
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown,
  Shield,
  User,
  Loader2,
  Users,
  X,
} from 'lucide-react';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import { useSharedCustomers } from '@/hooks/useSharedCustomers';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AssignCustomerToMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}

const ROLE_CONFIG = {
  admin: { label: 'مسؤول', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  manager: { label: 'مدير', icon: Shield, color: 'text-blue-600 bg-blue-50' },
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
  const { members, isLoading: membersLoading } = useTeamManagement();
  const { assignCustomerToMember } = useSharedCustomers(user?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // فلترة الأعضاء
  const activeMembers = members.filter(
    (m) => m.status === 'active' && m.member_user_id && m.member_user_id !== user?.id
  );

  const handleAssign = async (member: OrganizationMember) => {
    if (!user || !member.member_user_id) return;

    setIsSubmitting(true);

    try {
      const success = await assignCustomerToMember({
        customerId,
        assignToUserId: member.member_user_id,
        organizationUserId: user.id,
      });

      if (success) {
        toast.success(`تم تعيين "${customerName}" لـ ${member.member_name}`);
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[240px] p-0 gap-0 rounded-xl overflow-hidden" 
        dir="rtl"
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b bg-gradient-to-l from-[#01411C]/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#01411C]" />
            <span className="text-sm font-medium">اختر زميلاً</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Customer name */}
        <div className="px-3 py-1.5 bg-blue-50/50 border-b">
          <p className="text-xs text-blue-600 truncate">
            👤 {customerName}
          </p>
        </div>

        {/* Members List */}
        <ScrollArea className="max-h-[200px]">
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="text-center py-6 px-4">
              <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-600">لا يوجد زملاء</p>
              <p className="text-[10px] text-gray-400 mt-0.5">أضف زملاء من إدارة الفريق</p>
            </div>
          ) : (
            <div className="py-1">
              {activeMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.member_role];
                const RoleIcon = roleConfig.icon;

                return (
                  <button
                    key={member.id}
                    disabled={isSubmitting}
                    onClick={() => handleAssign(member)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#01411C]/5 transition-colors disabled:opacity-50 text-right group"
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
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#01411C]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
