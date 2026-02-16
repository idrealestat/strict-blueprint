/**
 * RegisteredUsersAnalytics.tsx
 * تحليلات المستخدمين الفعالين - رسوم بيانية وأداء
 */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Activity, BarChart3, PieChart,
  CheckCircle, Globe, Building2, User, CreditCard, Clock
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { format, subMonths, startOfMonth, isAfter } from "date-fns";
import { ar } from "date-fns/locale";

interface RegisteredUser {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  account_type: string | null;
  fal_license_number: string | null;
  company_name: string | null;
  profile_created: string;
  slug: string | null;
  published: boolean;
  card_created: string | null;
  card_data: any;
  listings_count?: number;
  customers_count?: number;
  appointments_count?: number;
}

interface Props {
  users: RegisteredUser[];
}

const COLORS = ["#01411C", "#D4AF37", "#065f41", "#8B6914", "#0a8f5e", "#B8860B", "#14b87a", "#DAA520"];

const RegisteredUsersAnalytics: React.FC<Props> = ({ users }) => {
  // === تحليلات نوع الحساب ===
  const accountTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const type = u.account_type || "غير محدد";
      const label = type === "individual" ? "فرد" : type === "office" ? "مكتب" : type === "company" ? "شركة" : type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  // === تحليلات التسجيل الشهري ===
  const monthlyRegistrations = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const key = format(month, "yyyy-MM");
      const label = format(month, "MMM yyyy", { locale: ar });
      months[key] = 0;
    }

    users.forEach(u => {
      const key = format(new Date(u.profile_created), "yyyy-MM");
      if (key in months) months[key]++;
    });

    return Object.entries(months).map(([key, count]) => ({
      month: format(new Date(key + "-01"), "MMM", { locale: ar }),
      عدد_المسجلين: count,
    }));
  }, [users]);

  // === حالة النشر ===
  const publishStatusData = useMemo(() => {
    const published = users.filter(u => u.published).length;
    const withSlugNotPublished = users.filter(u => u.slug && !u.published).length;
    const noCard = users.filter(u => !u.slug).length;
    return [
      { name: "منشورة", value: published },
      { name: "غير منشورة", value: withSlugNotPublished },
      { name: "بدون بطاقة", value: noCard },
    ];
  }, [users]);

  // === المستخدمين النشطين (لديهم عروض / عملاء / مواعيد) ===
  const activityData = useMemo(() => {
    const withListings = users.filter(u => (u.listings_count || 0) > 0).length;
    const withCustomers = users.filter(u => (u.customers_count || 0) > 0).length;
    const withAppointments = users.filter(u => (u.appointments_count || 0) > 0).length;
    const withFal = users.filter(u => u.fal_license_number).length;
    const withPhone = users.filter(u => u.phone).length;
    const withEmail = users.filter(u => u.email).length;

    return [
      { name: "لديهم عروض", value: withListings },
      { name: "لديهم عملاء", value: withCustomers },
      { name: "لديهم مواعيد", value: withAppointments },
      { name: "رخصة فال", value: withFal },
      { name: "رقم جوال", value: withPhone },
      { name: "بريد إلكتروني", value: withEmail },
    ];
  }, [users]);

  // === نمو المستخدمين التراكمي ===
  const cumulativeGrowth = useMemo(() => {
    const sorted = [...users].sort((a, b) => 
      new Date(a.profile_created).getTime() - new Date(b.profile_created).getTime()
    );
    
    const months: Record<string, number> = {};
    const now = new Date();
    let cumulative = 0;
    
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const key = format(month, "yyyy-MM");
      const monthStart = startOfMonth(month);
      const nextMonth = startOfMonth(subMonths(now, i - 1));
      
      const newThisMonth = sorted.filter(u => {
        const d = new Date(u.profile_created);
        return d >= monthStart && d < nextMonth;
      }).length;
      
      cumulative += newThisMonth;
      months[key] = cumulative;
    }

    return Object.entries(months).map(([key, total]) => ({
      month: format(new Date(key + "-01"), "MMM", { locale: ar }),
      الإجمالي: total,
    }));
  }, [users]);

  // === أفضل المستخدمين نشاطاً ===
  const topUsers = useMemo(() => {
    return [...users]
      .map(u => ({
        name: u.full_name || "بدون اسم",
        slug: u.slug || "-",
        score: (u.listings_count || 0) * 3 + (u.customers_count || 0) * 2 + (u.appointments_count || 0),
        listings: u.listings_count || 0,
        customers: u.customers_count || 0,
        appointments: u.appointments_count || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [users]);

  // === المسجلين الجدد (آخر 30 يوم) ===
  const recentUsers = useMemo(() => {
    const thirtyDaysAgo = subMonths(new Date(), 1);
    return users.filter(u => isAfter(new Date(u.profile_created), thirtyDaysAgo)).length;
  }, [users]);

  // === معدل إكمال البطاقة ===
  const completionRate = useMemo(() => {
    if (users.length === 0) return 0;
    const withCards = users.filter(u => u.slug).length;
    return Math.round((withCards / users.length) * 100);
  }, [users]);

  // === معدل النشر ===
  const publishRate = useMemo(() => {
    const withCards = users.filter(u => u.slug).length;
    if (withCards === 0) return 0;
    const published = users.filter(u => u.published).length;
    return Math.round((published / withCards) * 100);
  }, [users]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-[#01411C] to-[#065f41] text-white">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs opacity-80">إجمالي المستخدمين</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">{recentUsers}</div>
            <div className="text-xs opacity-80">جدد (30 يوم)</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-xs opacity-80">إكمال البطاقة</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <CardContent className="p-4 text-center">
            <Globe className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">{publishRate}%</div>
            <div className="text-xs opacity-80">معدل النشر</div>
          </CardContent>
        </Card>
      </div>

      {/* النمو التراكمي */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            النمو التراكمي للمستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cumulativeGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="الإجمالي" stroke="#01411C" fill="#01411C" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* التسجيل الشهري + نوع الحساب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              التسجيل الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="عدد_المسجلين" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#D4AF37]" />
              توزيع أنواع الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={accountTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {accountTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* حالة النشر + النشاط */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              حالة النشر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={publishStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#01411C" />
                  <Cell fill="#D4AF37" />
                  <Cell fill="#999" />
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              مؤشرات النشاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#065f41" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* أفضل المستخدمين نشاطاً */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            أكثر المستخدمين نشاطاً (أعلى 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا توجد بيانات نشاط بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 px-2 text-right">#</th>
                    <th className="py-2 px-2 text-right">الاسم</th>
                    <th className="py-2 px-2 text-right">الرابط</th>
                    <th className="py-2 px-2 text-center">العروض</th>
                    <th className="py-2 px-2 text-center">العملاء</th>
                    <th className="py-2 px-2 text-center">المواعيد</th>
                    <th className="py-2 px-2 text-center">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-2 font-bold text-[#D4AF37]">{i + 1}</td>
                      <td className="py-2 px-2 font-medium">{u.name}</td>
                      <td className="py-2 px-2 font-mono text-xs text-primary">{u.slug}</td>
                      <td className="py-2 px-2 text-center">{u.listings}</td>
                      <td className="py-2 px-2 text-center">{u.customers}</td>
                      <td className="py-2 px-2 text-center">{u.appointments}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className="text-xs">{u.score}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisteredUsersAnalytics;