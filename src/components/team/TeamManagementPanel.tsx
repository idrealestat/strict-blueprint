/**
 * TeamManagementPanel.tsx
 * لوحة إدارة الفريق - عرض الزملاء وإدارتهم
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Settings,
  Trash2,
  Edit,
  MoreVertical,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  Home,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamManagement, type OrganizationMember } from '@/hooks/useTeamManagement';
import AddColleagueDialog from './AddColleagueDialog';
import TeamSettingsPanel from './TeamSettingsPanel';
import TeamAnalyticsPanel from './TeamAnalyticsPanel';

interface TeamManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_CONFIG = {
  admin: {
    label: 'مسؤول',
    icon: Crown,
    color: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  manager: {
    label: 'مدير',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  member: {
    label: 'فرد',
    icon: User,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

const STATUS_CONFIG = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'في انتظار القبول', color: 'bg-amber-100 text-amber-700', icon: Clock },
  suspended: { label: 'معلق', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  removed: { label: 'محذوف', color: 'bg-gray-100 text-gray-500', icon: X },
};

export default function TeamManagementPanel({ isOpen, onClose }: TeamManagementPanelProps) {
  const {
    members,
    settings,
    isLoading,
    isOrganization,
    canManageTeam,
    organizationName,
    removeMember,
    updateMemberPermissions,
    refreshTeam,
  } = useTeamManagement();

  const [activeTab, setActiveTab] = useState('members');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    await removeMember(memberToRemove.id);
    setMemberToRemove(null);
  };

  const togglePermission = async (member: OrganizationMember, key: keyof OrganizationMember, value: boolean) => {
    await updateMemberPermissions(member.id, { [key]: value });
  };

  // إذا لم يكن مفتوحاً، لا نعرض شيء
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-gradient-to-b from-[#f5f0e6] to-white shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <div>
                    <h2 className="text-lg font-bold">إدارة الفريق</h2>
                    {organizationName && (
                      <p className="text-sm text-white/80">{organizationName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refreshTeam()}
                    className="text-white hover:bg-white/20"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex gap-4 mt-4">
                <div className="bg-white/20 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-2xl font-bold">{activeMembers.length}</p>
                  <p className="text-xs text-white/80">نشط</p>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-2xl font-bold">{pendingMembers.length}</p>
                  <p className="text-xs text-white/80">في الانتظار</p>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-white/80">الإجمالي</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto h-[calc(100vh-200px)]">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="members" className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    الزملاء
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    التحليلات
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    الإعدادات
                  </TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                  {/* Add Button */}
                  <Button
                    className="w-full bg-[#01411C] hover:bg-[#012d14]"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    إضافة زميل جديد
                  </Button>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">لم تتم إضافة زملاء بعد</p>
                        <p className="text-sm text-gray-400 mt-1">
                          ابدأ بإضافة زملائك للعمل معاً
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {members
                        .filter(m => m.status !== 'removed')
                        .map((member) => {
                          const roleConfig = ROLE_CONFIG[member.member_role];
                          const statusConfig = STATUS_CONFIG[member.status];
                          const RoleIcon = roleConfig.icon;
                          const StatusIcon = statusConfig.icon;

                          return (
                            <Card key={member.id} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className={roleConfig.color}>
                                      <RoleIcon className="w-5 h-5" />
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-gray-900 truncate">
                                        {member.member_name || 'غير معروف'}
                                      </span>
                                      <Badge className={`${roleConfig.color} text-xs`}>
                                        {roleConfig.label}
                                      </Badge>
                                      <Badge className={`${statusConfig.color} text-xs`}>
                                        <StatusIcon className="w-3 h-3 ml-1" />
                                        {statusConfig.label}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      {member.member_whatsapp && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {member.member_whatsapp}
                                        </span>
                                      )}
                                      {member.member_email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {member.member_email}
                                        </span>
                                      )}
                                    </div>

                                    {member.member_fal_license && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        <FileText className="w-3 h-3 inline ml-1" />
                                        رخصة: {member.member_fal_license}
                                      </p>
                                    )}

                                    {/* Permission Icons */}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {member.can_publish_properties && (
                                        <Badge variant="outline" className="text-xs">
                                          <Home className="w-3 h-3 ml-1" />
                                          نشر
                                        </Badge>
                                      )}
                                      {member.can_view_all_customers && (
                                        <Badge variant="outline" className="text-xs">
                                          <Users className="w-3 h-3 ml-1" />
                                          العملاء
                                        </Badge>
                                      )}
                                      {member.can_view_analytics && (
                                        <Badge variant="outline" className="text-xs">
                                          <BarChart3 className="w-3 h-3 ml-1" />
                                          تحليلات
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions Menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => setEditingMember(member)}
                                      >
                                        <Edit className="w-4 h-4 ml-2" />
                                        تعديل الصلاحيات
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => setMemberToRemove(member)}
                                      >
                                        <Trash2 className="w-4 h-4 ml-2" />
                                        إزالة الزميل
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                  <TeamAnalyticsPanel />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                  <TeamSettingsPanel />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* Add Colleague Dialog */}
          <AddColleagueDialog
            isOpen={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onSuccess={() => refreshTeam()}
          />

          {/* Remove Confirmation Dialog */}
          <AlertDialog
            open={!!memberToRemove}
            onOpenChange={() => setMemberToRemove(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إزالة زميل</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من إزالة "{memberToRemove?.member_name}"؟ سيفقد الوصول
                  إلى جميع بيانات الفريق.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleRemoveMember}
                >
                  إزالة
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
}
