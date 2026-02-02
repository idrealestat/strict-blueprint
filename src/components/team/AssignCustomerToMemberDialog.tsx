/**
 * AssignCustomerToMemberDialog.tsx
 * نافذة تعيين عميل لزميل - تظهر للمسؤولين في إدارة العملاء
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UserPlus,
  Search,
  Crown,
  Shield,
  User,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import { useSharedCustomers } from '@/hooks/useSharedCustomers';
import { useAuthContext } from '@/context/AuthContext';

interface AssignCustomerToMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}

const ROLE_CONFIG = {
  admin: { label: 'مسؤول', icon: Crown, color: 'text-amber-600' },
  manager: { label: 'مدير', icon: Shield, color: 'text-blue-600' },
  member: { label: 'فرد', icon: User, color: 'text-gray-600' },
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // فلترة الأعضاء
  const activeMembers = members.filter(
    (m) => m.status === 'active' && m.member_user_id && m.member_user_id !== user?.id
  );

  const filteredMembers = activeMembers.filter(
    (m) =>
      m.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.member_whatsapp?.includes(searchQuery) ||
      m.member_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedMemberId || !user) return;

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    if (!selectedMember?.member_user_id) return;

    setIsSubmitting(true);

    try {
      const success = await assignCustomerToMember({
        customerId,
        assignToUserId: selectedMember.member_user_id,
        organizationUserId: user.id,
        notes,
      });

      if (success) {
        onSuccess?.();
        onClose();
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedMemberId(null);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="w-5 h-5 text-[#01411C]" />
            تعيين عميل لزميل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-bold">العميل:</span> {customerName}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ابحث عن زميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Members List */}
          <ScrollArea className="h-[250px]">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">لا يوجد زملاء متاحين</p>
              </div>
            ) : (
              <RadioGroup
                value={selectedMemberId || ''}
                onValueChange={setSelectedMemberId}
                className="space-y-2"
              >
                {filteredMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.member_role];
                  const RoleIcon = roleConfig.icon;
                  const isSelected = selectedMemberId === member.id;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#01411C]/5 border-[#01411C]'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMemberId(member.id)}
                    >
                      <RadioGroupItem
                        value={member.id}
                        id={member.id}
                        className="sr-only"
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-100">
                          <RoleIcon className={`w-4 h-4 ${roleConfig.color}`} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {member.member_name || 'غير معروف'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {roleConfig.label}
                          </Badge>
                        </div>
                        {member.member_whatsapp && (
                          <p className="text-xs text-gray-500 truncate">
                            {member.member_whatsapp}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-[#01411C]" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </ScrollArea>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              placeholder="أي تعليمات أو ملاحظات للزميل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button
            className="bg-[#01411C] hover:bg-[#012d14]"
            onClick={handleSubmit}
            disabled={!selectedMemberId || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <UserPlus className="w-4 h-4 ml-2" />
            )}
            تعيين للزميل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
