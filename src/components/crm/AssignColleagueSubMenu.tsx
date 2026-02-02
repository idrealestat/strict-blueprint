/**
 * AssignColleagueSubMenu.tsx
 * قائمة فرعية لتعيين زميل داخل DropdownMenu
 */

import { useState } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Crown,
  Shield,
  User,
  Loader2,
  Users,
  UserCheck,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import { useSharedCustomers } from '@/hooks/useSharedCustomers';
import { useAuthContext } from '@/context/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

interface AssignColleagueSubMenuProps {
  customerId: string;
  customerName: string;
  onSuccess?: (assigned: { userId: string; name: string }) => void;
}

const ROLE_CONFIG = {
  admin: { label: 'مسؤول', icon: Crown, color: 'text-amber-600 bg-amber-100' },
  manager: { label: 'مدير', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  member: { label: 'فرد', icon: User, color: 'text-gray-600 bg-gray-100' },
};

export default function AssignColleagueSubMenu({
  customerId,
  customerName,
  onSuccess,
}: AssignColleagueSubMenuProps) {
  const { user } = useAuthContext();
  const { currentUser } = useCurrentUser();
  const { members, isLoading: membersLoading } = useTeamManagement();
  const { assignCustomerToMember } = useSharedCustomers(user?.id);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فلترة الأعضاء النشطين
  const activeMembers = members.filter(
    (m) => m.status === 'active' && m.member_user_id && m.member_user_id !== user?.id
  );

  // اسم المسؤول الحالي
  const currentUserName = currentUser?.name || currentUser?.companyName || 'المسؤول';

  const handleAssign = async (member: OrganizationMember, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user || !member.member_user_id) return;

    setIsSubmitting(true);

    try {
      const success = await assignCustomerToMember({
        customerId,
        assignToUserId: member.member_user_id,
        organizationUserId: user.id,
        notes: notes.trim() || undefined,
        senderName: currentUserName,
      });

      if (success) {
        toast.success(`تم تعيين "${customerName}" لـ ${member.member_name}`);
        onSuccess?.({
          userId: member.member_user_id,
          name: member.member_name || 'غير معروف',
        });
        setNotes('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2 text-[#01411C]">
        <UserCheck className="w-4 h-4" />
        <span>معين لـ:</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="bg-white min-w-[220px] p-0">
          {/* Header */}
          <div className="px-3 py-2 border-b bg-gradient-to-l from-[#01411C]/10 to-white">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#01411C]" />
              <span className="text-sm font-bold text-gray-800">اختر زميلاً</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              👤 {customerName}
            </p>
          </div>

          {/* قائمة الزملاء */}
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
            <div className="py-1 max-h-[180px] overflow-y-auto">
              {activeMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.member_role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.member;
                const RoleIcon = roleConfig.icon;

                return (
                  <DropdownMenuItem
                    key={member.id}
                    disabled={isSubmitting}
                    onClick={(e) => handleAssign(member, e)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Avatar className="w-7 h-7 shrink-0 border border-gray-200">
                      <AvatarFallback className={roleConfig.color}>
                        <RoleIcon className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.member_name || 'غير معروف'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {roleConfig.label}
                      </p>
                    </div>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#01411C]" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}

          {/* حقل الملاحظة في الأسفل */}
          {activeMembers.length > 0 && (
            <div className="p-2 border-t bg-gray-50/50">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-500">ملاحظة للزميل (اختياري)</span>
              </div>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="اكتب ملاحظة تظهر في الإشعار..."
                className="text-xs h-7 bg-white"
              />
              {notes.trim() && (
                <p className="text-[9px] text-amber-600 mt-1 flex items-center gap-1">
                  🔔 ستظهر مع اسمك في إشعار الزميل
                </p>
              )}
            </div>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
