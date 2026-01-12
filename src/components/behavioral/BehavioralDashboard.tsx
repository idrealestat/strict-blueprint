/**
 * BehavioralDashboard.tsx
 * Owner-only dashboard for behavioral intelligence insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Brain, Activity, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Clock, Users, MessageCircle, Lightbulb, Target,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw,
  Eye, Zap, Shield, Award, PlayCircle,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// Types
interface OverviewStats {
  totalSessions: number;
  stuckSessions: number;
  rescuedSessions: number;
  silentExits: number;
  explainedExits: number;
  assistantInterventions: number;
  rescueRate: number;
}

interface BehavioralSignal {
  id: string;
  signal_type: string;
  page_path: string;
  page_name: string;
  duration_seconds: number;
  assistant_intervened: boolean;
  intervention_result: string | null;
  created_at: string;
}

interface SmartInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  page_path: string;
  severity: string;
  occurrence_count: number;
  suggested_improvement: string;
  implementation_priority: string;
  status: string;
  created_at: string;
}

// Signal type labels
const SIGNAL_LABELS: Record<string, string> = {
  freeze: 'توقف/تجمّد',
  exit: 'خروج',
  hesitation: 'تردد',
  rapid_navigation: 'تصفح سريع',
  repeated_errors: 'أخطاء متكررة',
  typing_hesitation: 'تردد في الكتابة',
};

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  freeze: <Clock className="w-4 h-4 text-amber-500" />,
  exit: <XCircle className="w-4 h-4 text-red-500" />,
  hesitation: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  rapid_navigation: <Zap className="w-4 h-4 text-blue-500" />,
  repeated_errors: <AlertTriangle className="w-4 h-4 text-red-500" />,
  typing_hesitation: <Clock className="w-4 h-4 text-purple-500" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'border-green-300',
  medium: 'border-amber-300',
  high: 'border-orange-300',
  urgent: 'border-red-300',
};

export function BehavioralDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  
  // Data states
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [signals, setSignals] = useState<BehavioralSignal[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [investorMetrics, setInvestorMetrics] = useState<any>(null);
  const [conversationAnalytics, setConversationAnalytics] = useState<any>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = subDays(new Date(), timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
      
      // Fetch sessions for overview
      const { data: sessions } = await supabase
        .from('behavioral_sessions')
        .select('*')
        .gte('started_at', startDate.toISOString());

      // Fetch conversations for analysis
      const { data: conversations } = await supabase
        .from('assistant_conversations')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (sessions) {
        const totalSessions = sessions.length;
        const stuckSessions = sessions.filter(s => s.was_stuck).length;
        const rescuedSessions = sessions.filter(s => s.was_rescued).length;
        const silentExits = sessions.filter(s => s.exit_type === 'silent').length;
        const explainedExits = sessions.filter(s => s.exit_type === 'explained' || s.exit_type === 'helped' || s.exit_type === 'frustrated').length;
        const frustratedExits = sessions.filter(s => s.exit_type === 'frustrated').length;
        const assistantInterventions = sessions.reduce((sum, s) => sum + (s.assistant_interventions || 0), 0);

        setOverviewStats({
          totalSessions,
          stuckSessions,
          rescuedSessions,
          silentExits,
          explainedExits,
          assistantInterventions,
          rescueRate: stuckSessions > 0 ? (rescuedSessions / stuckSessions) * 100 : 0,
        });

        // Calculate investor metrics with additional data
        const avgTimeToRescue = calculateAvgTimeToRescue(sessions, conversations || []);
        const userRetentionAfterHelp = calculateUserRetention(sessions);
        
        setInvestorMetrics({
          assistedCompletionRate: totalSessions > 0 ? (rescuedSessions / totalSessions) * 100 : 0,
          frictionIndex: totalSessions > 0 ? (stuckSessions / totalSessions) * 100 : 0,
          learningCurveIndex: calculateLearningCurve(sessions),
          trustRecoveryScore: stuckSessions > 0 ? (rescuedSessions / stuckSessions) * 100 : 0,
          featureConfusionIndex: calculateConfusionIndex(sessions),
          avgTimeToRescue,
          userRetentionAfterHelp,
          frustrationRate: totalSessions > 0 ? (frustratedExits / totalSessions) * 100 : 0,
          selfServiceRate: totalSessions > 0 ? ((totalSessions - stuckSessions) / totalSessions) * 100 : 0,
        });
      }

      // Analyze conversations
      if (conversations && conversations.length > 0) {
        const problemTypes: Record<string, number> = {};
        const intents: Record<string, number> = {};
        const sentiments: Record<string, number> = {};
        
        conversations.forEach(conv => {
          const analysis = conv.analysis as any;
          if (analysis) {
            // Count problem types
            if (analysis.problemType && analysis.problemType !== 'none') {
              problemTypes[analysis.problemType] = (problemTypes[analysis.problemType] || 0) + 1;
            }
            // Count intents
            if (analysis.intent && analysis.intent !== 'unknown') {
              intents[analysis.intent] = (intents[analysis.intent] || 0) + 1;
            }
            // Count sentiments
            if (analysis.sentiment) {
              sentiments[analysis.sentiment] = (sentiments[analysis.sentiment] || 0) + 1;
            }
          }
        });

        setConversationAnalytics({
          totalConversations: conversations.length,
          problemTypes,
          intents,
          sentiments,
          topProblems: Object.entries(problemTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
          avgMessagesPerConversation: conversations.reduce((sum, c) => {
            const msgs = c.messages as any[];
            return sum + (msgs?.length || 0);
          }, 0) / conversations.length || 0,
        });
      }

      // Fetch signals
      const { data: signalsData } = await supabase
        .from('behavioral_signals')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      setSignals(signalsData || []);

      // Fetch insights
      const { data: insightsData } = await supabase
        .from('behavioral_insights')
        .select('*')
        .order('created_at', { ascending: false });

      setInsights(insightsData || []);

      // Generate insights if needed
      if ((!insightsData?.length || insightsData.length < 3) && signalsData?.length) {
        await generateInsights(signalsData, conversations || []);
      }

    } catch (error) {
      console.error('Error fetching behavioral data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate learning curve (improvement over time)
  function calculateLearningCurve(sessions: any[]): number {
    if (sessions.length < 10) return 50;
    
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
    
    const firstStuckRate = firstHalf.filter(s => s.was_stuck).length / firstHalf.length;
    const secondStuckRate = secondHalf.filter(s => s.was_stuck).length / secondHalf.length;
    
    const improvement = firstStuckRate - secondStuckRate;
    return Math.min(100, Math.max(0, 50 + (improvement * 100)));
  }

  // Calculate feature confusion index
  function calculateConfusionIndex(sessions: any[]): number {
    const totalSignals = sessions.reduce((sum, s) => sum + (s.total_signals || 0), 0);
    const avgSignalsPerSession = sessions.length > 0 ? totalSignals / sessions.length : 0;
    
    // Lower is better, normalize to 0-100 where 0 is best
    return Math.min(100, avgSignalsPerSession * 10);
  }

  // Calculate average time to rescue
  function calculateAvgTimeToRescue(sessions: any[], conversations: any[]): number {
    const rescuedSessions = sessions.filter(s => s.was_rescued);
    if (rescuedSessions.length === 0) return 0;

    let totalTime = 0;
    rescuedSessions.forEach(session => {
      const conv = conversations.find(c => c.session_id === session.session_id);
      if (conv && conv.created_at && conv.ended_at) {
        const start = new Date(conv.created_at).getTime();
        const end = new Date(conv.ended_at).getTime();
        totalTime += (end - start) / 1000; // seconds
      }
    });

    return totalTime / rescuedSessions.length || 0;
  }

  // Calculate user retention after help
  function calculateUserRetention(sessions: any[]): number {
    // Users who continued after being helped
    const helpedSessions = sessions.filter(s => s.was_rescued);
    const continuedAfterHelp = helpedSessions.filter(s => 
      s.pages_visited && s.pages_visited.length > 2
    ).length;

    return helpedSessions.length > 0 
      ? (continuedAfterHelp / helpedSessions.length) * 100 
      : 0;
  }

  // Generate insights from signals and conversations
  async function generateInsights(signalsData: BehavioralSignal[], conversations: any[]) {
    const pageFrequency: Record<string, { count: number; types: string[] }> = {};
    const problemTypeCount: Record<string, number> = {};
    
    signalsData.forEach(signal => {
      if (!pageFrequency[signal.page_path]) {
        pageFrequency[signal.page_path] = { count: 0, types: [] };
      }
      pageFrequency[signal.page_path].count++;
      if (!pageFrequency[signal.page_path].types.includes(signal.signal_type)) {
        pageFrequency[signal.page_path].types.push(signal.signal_type);
      }
    });

    // Analyze conversation problem types
    conversations.forEach(conv => {
      const analysis = conv.analysis as any;
      if (analysis?.problemType && analysis.problemType !== 'none') {
        problemTypeCount[analysis.problemType] = (problemTypeCount[analysis.problemType] || 0) + 1;
      }
    });

    const newInsights: any[] = [];

    // Page friction insights
    Object.entries(pageFrequency)
      .filter(([_, data]) => data.count >= 3)
      .forEach(([path, data]) => {
        newInsights.push({
          insight_type: 'friction_page',
          title: `صفحة تسبب صعوبة: ${path}`,
          description: `${data.count} إشارات سلوكية مسجلة في هذه الصفحة`,
          page_path: path,
          severity: data.count >= 10 ? 'high' : data.count >= 5 ? 'medium' : 'low',
          occurrence_count: data.count,
          suggested_improvement: 'مراجعة تصميم الصفحة وإضافة توجيهات واضحة',
          implementation_priority: data.count >= 10 ? 'high' : 'medium',
          metadata: { signalTypes: data.types },
        });
      });

    // Problem type insights
    Object.entries(problemTypeCount)
      .filter(([_, count]) => count >= 2)
      .forEach(([problemType, count]) => {
        const problemLabels: Record<string, { title: string; suggestion: string }> = {
          technical: { 
            title: 'مشاكل تقنية متكررة', 
            suggestion: 'مراجعة الأخطاء البرمجية وتحسين الأداء' 
          },
          design: { 
            title: 'صعوبات في التصميم', 
            suggestion: 'تحسين واجهة المستخدم وجعلها أكثر وضوحاً' 
          },
          linguistic: { 
            title: 'مشاكل في فهم النصوص', 
            suggestion: 'تبسيط اللغة وإضافة شروحات توضيحية' 
          },
          navigation: { 
            title: 'صعوبة في التنقل', 
            suggestion: 'تحسين بنية التنقل وإضافة روابط سريعة' 
          },
          process: { 
            title: 'ارتباك في الخطوات', 
            suggestion: 'إضافة شريط تقدم وتوضيح الخطوات' 
          },
        };

        const label = problemLabels[problemType] || { 
          title: `مشكلة من نوع: ${problemType}`, 
          suggestion: 'مراجعة وتحسين' 
        };

        newInsights.push({
          insight_type: 'problem_pattern',
          title: label.title,
          description: `تم تسجيل ${count} حالة من هذا النوع`,
          severity: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
          occurrence_count: count,
          suggested_improvement: label.suggestion,
          implementation_priority: count >= 5 ? 'high' : 'medium',
          metadata: { problemType },
        });
      });

    if (newInsights.length > 0) {
      await supabase.from('behavioral_insights').insert(newInsights);
      fetchData();
    }
  }

  // Update insight status
  const updateInsightStatus = async (id: string, status: string) => {
    await supabase.from('behavioral_insights')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#01411C]" />
            الذكاء السلوكي
          </h2>
          <p className="text-gray-600 text-sm">تحليلات متقدمة لفهم سلوك المستخدمين وتحسين التجربة</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              // Dispatch custom event to trigger assistant
              window.dispatchEvent(new CustomEvent('trigger-smart-assistant', {
                detail: { reason: 'manual_test', message: 'هذا اختبار يدوي للمساعد الذكي. هل تحتاج مساعدة؟' }
              }));
              toast.success('تم إطلاق المساعد الذكي! سيظهر في أسفل الشاشة');
            }}
            className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white hover:opacity-90"
          >
            <PlayCircle className="w-4 h-4 ml-2" />
            اختبار المساعد
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يوم</SelectItem>
              <SelectItem value="90d">آخر 90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="signals">الإشارات</TabsTrigger>
          <TabsTrigger value="insights">التحليلات</TabsTrigger>
          <TabsTrigger value="investor">المستثمر</TabsTrigger>
          <TabsTrigger value="actions">التوصيات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {overviewStats && (
            <>
              {/* Main KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">إجمالي الجلسات</p>
                        <p className="text-3xl font-bold">{overviewStats.totalSessions}</p>
                      </div>
                      <Users className="w-10 h-10 text-blue-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">جلسات متعثرة</p>
                        <p className="text-3xl font-bold text-amber-600">{overviewStats.stuckSessions}</p>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-amber-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">تم إنقاذها</p>
                        <p className="text-3xl font-bold text-green-600">{overviewStats.rescuedSessions}</p>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">نسبة الإنقاذ</p>
                        <p className="text-3xl font-bold text-[#01411C]">{overviewStats.rescueRate.toFixed(1)}%</p>
                      </div>
                      <Target className="w-10 h-10 text-[#01411C] opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Exit Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">مقارنة أنواع الخروج</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-600">{overviewStats.silentExits}</p>
                      <p className="text-sm text-gray-600">خروج صامت</p>
                      <p className="text-xs text-gray-400 mt-1">بدون توضيح السبب</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-600">{overviewStats.explainedExits}</p>
                      <p className="text-sm text-gray-600">خروج مع توضيح</p>
                      <p className="text-xs text-gray-400 mt-1">وضّح السبب للمساعد</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                الإشارات السلوكية
              </CardTitle>
              <CardDescription>جميع الإشارات المسجلة من سلوك المستخدمين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النوع</TableHead>
                      <TableHead>الصفحة</TableHead>
                      <TableHead>المدة</TableHead>
                      <TableHead>تدخل المساعد</TableHead>
                      <TableHead>النتيجة</TableHead>
                      <TableHead>التوقيت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          لا توجد إشارات مسجلة
                        </TableCell>
                      </TableRow>
                    ) : (
                      signals.map((signal) => (
                        <TableRow key={signal.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {SIGNAL_ICONS[signal.signal_type]}
                              <span>{SIGNAL_LABELS[signal.signal_type] || signal.signal_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{signal.page_name || signal.page_path}</TableCell>
                          <TableCell>
                            {signal.duration_seconds ? `${signal.duration_seconds} ثانية` : '-'}
                          </TableCell>
                          <TableCell>
                            {signal.assistant_intervened ? (
                              <Badge className="bg-green-100 text-green-800">نعم</Badge>
                            ) : (
                              <Badge variant="outline">لا</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {signal.intervention_result === 'completed' ? (
                              <span className="text-green-600">أكمل</span>
                            ) : signal.intervention_result === 'exited' ? (
                              <span className="text-red-600">خرج</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(parseISO(signal.created_at), 'dd MMM HH:mm', { locale: ar })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                التحليلات الذكية
              </CardTitle>
              <CardDescription>استنتاجات تلقائية من أنماط السلوك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد تحليلات حالياً</p>
                  <p className="text-sm">ستظهر هنا عند توفر بيانات كافية</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border-2 ${PRIORITY_COLORS[insight.implementation_priority]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={SEVERITY_COLORS[insight.severity]}>
                            {insight.severity === 'critical' ? 'حرج' : 
                             insight.severity === 'high' ? 'عالي' :
                             insight.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <h4 className="font-medium">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                        {insight.suggested_improvement && (
                          <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-800">{insight.suggested_improvement}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mr-4">
                        <Badge variant="outline" className="text-xs">
                          {insight.occurrence_count} تكرار
                        </Badge>
                        <Select
                          value={insight.status}
                          onValueChange={(v) => updateInsightStatus(insight.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">جديد</SelectItem>
                            <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                            <SelectItem value="planned">مخطط</SelectItem>
                            <SelectItem value="implemented">تم التنفيذ</SelectItem>
                            <SelectItem value="dismissed">مرفوض</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Metrics Tab */}
        <TabsContent value="investor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#01411C]" />
                مؤشرات المستثمر
              </CardTitle>
              <CardDescription>مقاييس جاهزة للعرض على المستثمرين</CardDescription>
            </CardHeader>
            <CardContent>
              {investorMetrics && (
                <div className="grid gap-6">
                  {/* Assisted Completion Rate */}
                  <div className="p-4 bg-gradient-to-l from-green-50 to-emerald-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Assisted Completion Rate</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {investorMetrics.assistedCompletionRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={investorMetrics.assistedCompletionRate} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">نسبة الجلسات التي أكملت بنجاح بعد تدخل المساعد</p>
                  </div>

                  {/* Friction Index */}
                  <div className="p-4 bg-gradient-to-l from-amber-50 to-orange-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-medium">Friction Index</span>
                      </div>
                      <span className="text-2xl font-bold text-amber-600">
                        {investorMetrics.frictionIndex.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={100 - investorMetrics.frictionIndex} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">مؤشر الاحتكاك - كلما انخفض كان أفضل</p>
                  </div>

                  {/* Learning Curve Index */}
                  <div className="p-4 bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Learning Curve Index</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {investorMetrics.learningCurveIndex.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={investorMetrics.learningCurveIndex} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">سرعة تعلم المستخدمين للتطبيق</p>
                  </div>

                  {/* Trust Recovery Score */}
                  <div className="p-4 bg-gradient-to-l from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">Trust Recovery Score</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {investorMetrics.trustRecoveryScore.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={investorMetrics.trustRecoveryScore} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">نسبة استعادة ثقة المستخدم بعد مواجهة مشكلة</p>
                  </div>

                  {/* Feature Confusion Index */}
                  <div className="p-4 bg-gradient-to-l from-red-50 to-rose-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Feature Confusion Index</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">
                        {investorMetrics.featureConfusionIndex.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={100 - investorMetrics.featureConfusionIndex} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">مستوى الارتباك في استخدام الميزات - كلما انخفض كان أفضل</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions/Recommendations Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#01411C]" />
                التوصيات والإجراءات
              </CardTitle>
              <CardDescription>تحويل المشاكل إلى قرارات تطوير واضحة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights
                .filter(i => i.status !== 'implemented' && i.status !== 'dismissed')
                .sort((a, b) => {
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.implementation_priority as keyof typeof priorityOrder] - 
                         priorityOrder[b.implementation_priority as keyof typeof priorityOrder];
                })
                .map((insight, idx) => (
                  <div
                    key={insight.id}
                    className="p-4 border rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#01411C]/10 flex items-center justify-center text-[#01411C] font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={
                            insight.implementation_priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            insight.implementation_priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            insight.implementation_priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {insight.implementation_priority === 'urgent' ? 'عاجل' :
                             insight.implementation_priority === 'high' ? 'أولوية عالية' :
                             insight.implementation_priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        <div className="flex items-center gap-2 p-3 bg-[#01411C]/5 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-[#01411C]" />
                          <div>
                            <p className="text-sm font-medium text-[#01411C]">التحسين المقترح</p>
                            <p className="text-sm text-gray-700">{insight.suggested_improvement}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateInsightStatus(insight.id, 'planned')}
                      >
                        تحديد للتنفيذ
                      </Button>
                    </div>
                  </div>
                ))}
              
              {insights.filter(i => i.status !== 'implemented' && i.status !== 'dismissed').length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد توصيات معلقة</p>
                  <p className="text-sm">ممتاز! كل المشاكل تم التعامل معها</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
