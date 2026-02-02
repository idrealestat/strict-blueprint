/**
 * WorkspacePanel.tsx
 * لوحة مساحة العمل - للتبديل بين الحسابات
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  User,
  Building2,
  Users,
  Plus,
  Check,
  AlertCircle,
  ArrowRight,
  Shield,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspacePanel({ isOpen, onClose }: WorkspacePanelProps) {
  const navigate = useNavigate();
  const {
    availableAccounts,
    activeAccountId,
    isAddedToOrganization,
    hasPersonalAccount,
    canCreatePersonalAccount,
    isLoading,
    message,
    switchAccount,
  } = useWorkspace();

  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === activeAccountId) return;

    setSwitching(accountId);
    try {
      const success = await switchAccount(accountId);
      if (success) {
        toast.success('تم التبديل للحساب بنجاح');
        // إعادة تحميل الصفحة للتأكد من تحديث جميع البيانات
        window.location.reload();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التبديل');
    } finally {
      setSwitching(null);
    }
  };

  const handleCreatePersonalAccount = () => {
    onClose();
    navigate('/app/businesscard/edit?mode=personal');
  };

  const getAccountIcon = (type: string, accountType?: string | null) => {
    if (type === 'personal') {
      return <User className="w-5 h-5" />;
    }
    if (accountType === 'company') {
      return <Building2 className="w-5 h-5" />;
    }
    return <Users className="w-5 h-5" />;
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-amber-500 text-white text-xs">
            <Crown className="w-3 h-3 ml-1" />
            مدير
          </Badge>
        );
      case 'member':
        return (
          <Badge className="bg-blue-500 text-white text-xs">
            <Shield className="w-3 h-3 ml-1" />
            عضو
          </Badge>
        );
      case 'viewer':
        return (
          <Badge variant="outline" className="text-xs">
            مشاهد
          </Badge>
        );
      default:
        return null;
    }
  };

  const getAccountTypeBadge = (type: string, accountType?: string | null) => {
    if (type === 'personal') {
      return (
        <Badge variant="outline" className="text-xs border-green-500 text-green-600">
          حساب شخصي
        </Badge>
      );
    }
    if (accountType === 'company') {
      return (
        <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
          شركة
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
        مكتب
      </Badge>
    );
  };

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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-[#f5f0e6] to-white shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#01411C] to-[#065f41] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6" />
                  <h2 className="text-lg font-bold">مساحة العمل</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-white/80 mt-2">
                تنقل بين حساباتك المختلفة بسهولة
              </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-140px)]">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  {/* رسالة التنبيه إذا لم يكن مضاف في شركة */}
                  {message && !isAddedToOrganization && (
                    <Alert className="border-amber-300 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        {message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* قائمة الحسابات */}
                  {availableAccounts.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        حساباتك المتاحة
                      </h3>

                      {availableAccounts.map((account) => (
                        <Card
                          key={account.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            account.id === activeAccountId
                              ? 'ring-2 ring-[#01411C] bg-green-50'
                              : 'hover:shadow-md hover:border-[#01411C]/30'
                          }`}
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className={`w-12 h-12 ${
                                account.type === 'personal' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                <AvatarFallback className="bg-transparent">
                                  {getAccountIcon(account.type, account.accountType)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 truncate">
                                    {account.name}
                                  </span>
                                  {account.id === activeAccountId && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      <Check className="w-3 h-3 ml-1" />
                                      نشط
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {getAccountTypeBadge(account.type, account.accountType)}
                                  {account.role && getRoleBadge(account.role)}
                                </div>

                                {account.falLicenseNumber && (
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    رخصة فال: {account.falLicenseNumber}
                                  </p>
                                )}
                              </div>

                              {switching === account.id && (
                                <div className="w-5 h-5 border-2 border-[#01411C] border-t-transparent rounded-full animate-spin" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">
                          لا توجد حسابات متاحة حالياً
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* زر إنشاء حساب شخصي - يظهر فقط إذا كان مضاف في شركة وليس لديه حساب شخصي */}
                  {canCreatePersonalAccount && (
                    <Card className="border-dashed border-green-300 bg-green-50/50">
                      <CardContent className="p-4">
                        <Button
                          variant="outline"
                          className="w-full border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white"
                          onClick={handleCreatePersonalAccount}
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إنشاء حساب شخصي خاص بي
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          يمكنك إنشاء حساب شخصي منفصل عن حساب الشركة/المكتب
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* معلومات إضافية */}
                  {isAddedToOrganization && hasPersonalAccount && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 text-sm">
                        <strong>ملاحظة:</strong> جميع حساباتك منفصلة تماماً عن بعضها. 
                        البيانات والعملاء والعروض لكل حساب مستقلة.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
