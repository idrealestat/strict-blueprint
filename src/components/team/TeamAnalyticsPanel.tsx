/**
 * TeamAnalyticsPanel.tsx
 * لوحة تحليلات أداء الفريق - للمسؤولين
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  TrendingUp,
  Phone,
  Calendar,
  Home,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Crown,
  Shield,
  User,
  Loader2,
  FileText,
} from 'lucide-react';
import { useTeamAnalytics } from '@/hooks/useTeamAnalytics';
import { useAuthContext } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ACTIVITY_ICONS: Record<string, any> = {
  customer_added: Users,
  customer_contacted: Phone,
  opportunity_accepted: CheckCircle,
  opportunity_rejected: XCircle,
  property_published: Home,
  offer_created: FileText,
  request_created: FileText,
  call_made: Phone,
  meeting_scheduled: Calendar,
};

const ACTIVITY_LABELS: Record<string, string> = {
  customer_added: 'إضافة عميل',
  customer_contacted: 'تواصل مع عميل',
  opportunity_accepted: 'قبول فرصة',
  opportunity_rejected: 'رفض فرصة',
  property_published: 'نشر عقار',
  offer_created: 'إنشاء عرض',
  request_created: 'إنشاء طلب',
  call_made: 'مكالمة',
  meeting_scheduled: 'حجز موعد',
};

const ROLE_ICONS: Record<string, any> = {
  admin: Crown,
  manager: Shield,
  member: User,
};

export default function TeamAnalyticsPanel() {
  const { user } = useAuthContext();
  const { data, isLoading, dateRange, setDateRange } = useTeamAnalytics(user?.id);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">لا توجد بيانات متاحة</p>
        </CardContent>
      </Card>
    );
  }

  const selectedMemberData = selectedMember
    ? data.memberActivities.find(m => m.userId === selectedMember)
    : null;

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{data.activeMembers}</p>
            <p className="text-xs text-blue-600">أعضاء نشطين</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">
              {data.acceptedOpportunities}/{data.totalOpportunities}
            </p>
            <p className="text-xs text-green-600">فرص مقبولة</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-800">{data.sharedCustomers}</p>
            <p className="text-xs text-purple-600">عملاء مشتركين</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-amber-800">
              {data.activityTimeline.reduce((sum, d) => sum + d.activities, 0)}
            </p>
            <p className="text-xs text-amber-600">نشاط (30 يوم)</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5" />
            أداء الزملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {data.memberActivities.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role] || User;
                const totalActivities = Object.values(member.stats).reduce((a, b) => a + b, 0);
                const maxActivities = Math.max(
                  ...data.memberActivities.map(m =>
                    Object.values(m.stats).reduce((a, b) => a + b, 0)
                  ),
                  1
                );
                const percentage = (totalActivities / maxActivities) * 100;

                return (
                  <div
                    key={member.userId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMember === member.userId
                        ? 'bg-[#01411C]/5 border-[#01411C]'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      setSelectedMember(
                        selectedMember === member.userId ? null : member.userId
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        <RoleIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{member.memberName}</span>
                          <Badge variant="outline" className="text-xs">
                            {member.role === 'admin'
                              ? 'مسؤول'
                              : member.role === 'manager'
                              ? 'مدير'
                              : 'فرد'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={percentage} className="h-2 flex-1" />
                          <span className="text-xs text-gray-500 w-12">
                            {totalActivities} نشاط
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Stats */}
                    {selectedMember === member.userId && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            {member.stats.customersAdded}
                          </p>
                          <p className="text-xs text-gray-500">عملاء</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {member.stats.opportunitiesAccepted}
                          </p>
                          <p className="text-xs text-gray-500">فرص مقبولة</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">
                            {member.stats.propertiesPublished}
                          </p>
                          <p className="text-xs text-gray-500">عقارات</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-amber-600">
                            {member.stats.callsMade}
                          </p>
                          <p className="text-xs text-gray-500">مكالمات</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-indigo-600">
                            {member.stats.meetingsScheduled}
                          </p>
                          <p className="text-xs text-gray-500">مواعيد</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">
                            {member.stats.opportunitiesRejected}
                          </p>
                          <p className="text-xs text-gray-500">فرص مرفوضة</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-600">
                            {member.stats.assignedCustomersCount}
                          </p>
                          <p className="text-xs text-gray-500">عملاء معينون</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {selectedMemberData && selectedMemberData.recentActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5" />
              آخر أنشطة {selectedMemberData.memberName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selectedMemberData.recentActivities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || Activity;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <div className="p-1.5 rounded-full bg-white">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ACTIVITY_LABELS[activity.type] || activity.type}
                        </p>
                        {activity.title && (
                          <p className="text-xs text-gray-500 truncate">
                            {activity.title}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(activity.timestamp), 'dd MMM', { locale: ar })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
