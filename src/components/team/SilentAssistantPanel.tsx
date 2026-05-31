/**
 * SilentAssistantPanel.tsx
 * تبويب المساعد الصامت داخل لوحة إدارة الفريق
 * يعرض تنبيهات تلقائية حول أداء الأعضاء (عملاء بدون متابعة، أهداف غير محققة...)
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, CheckCircle2, X, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useSilentAssistantAlerts } from '@/hooks/useSilentAssistantAlerts';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useCustomerAssignments } from '@/hooks/useCustomerAssignments';

const SEVERITY = {
  high: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertCircle, label: 'عالية' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle, label: 'متوسطة' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Info, label: 'منخفضة' },
} as const;

export default function SilentAssistantPanel() {
  const { alerts, isLoading, resolveAlert, dismissAlert } = useSilentAssistantAlerts();
  const { members } = useTeamManagement();
  const { assignments } = useCustomerAssignments();

  // توقعات محلية فورية (تكميلية للتنبيهات المخزّنة)
  const localInsights = useMemo(() => {
    const insights: Array<{ id: string; severity: 'low' | 'medium' | 'high'; title: string; description: string }> = [];
    const activeMembers = members.filter(m => m.status === 'active');

    activeMembers.forEach(m => {
      const memberAssignments = assignments.filter(a => a.assigned_to_user_id === m.member_user_id);
      if (memberAssignments.length === 0 && m.member_user_id) {
        insights.push({
          id: `no-customers-${m.id}`,
          severity: 'low',
          title: `${m.member_name || 'عضو'} بدون عملاء مسندين`,
          description: 'لم يتم إسناد أي عميل لهذا العضو حتى الآن. قد يكون أداؤه محدوداً.',
        });
      } else if (memberAssignments.length > 20) {
        insights.push({
          id: `overloaded-${m.id}`,
          severity: 'medium',
          title: `${m.member_name || 'عضو'} لديه ضغط عملاء (${memberAssignments.length})`,
          description: 'عدد كبير من العملاء المسندين قد يؤثر على جودة المتابعة.',
        });
      }
    });

    return insights;
  }, [members, assignments]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  const hasContent = alerts.length > 0 || localInsights.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gradient-to-l from-amber-50 to-transparent p-3 rounded-lg border border-amber-200">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>المساعد الصامت يراقب أداء فريقك ويقترح تحسينات تلقائياً.</span>
      </div>

      {!hasContent ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Bot className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">لا توجد تنبيهات حالياً</p>
            <p className="text-sm text-gray-400 mt-1">فريقك يعمل بانتظام</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {alerts.map(a => {
            const sev = SEVERITY[a.severity] || SEVERITY.medium;
            const Icon = sev.icon;
            return (
              <Card key={a.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${sev.color}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{a.title}</span>
                        <Badge className={`${sev.color} text-xs`}>{sev.label}</Badge>
                      </div>
                      {a.description && (
                        <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => resolveAlert(a.id)} className="h-7">
                          <CheckCircle2 className="w-3 h-3 ml-1" /> تم الحل
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dismissAlert(a.id)} className="h-7 text-gray-500">
                          <X className="w-3 h-3 ml-1" /> تجاهل
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {localInsights.map(ins => {
            const sev = SEVERITY[ins.severity];
            const Icon = sev.icon;
            return (
              <Card key={ins.id} className="overflow-hidden border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${sev.color}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{ins.title}</span>
                        <Badge variant="outline" className="text-xs">رؤية فورية</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ins.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
