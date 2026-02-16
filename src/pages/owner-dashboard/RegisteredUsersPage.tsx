/**
 * RegisteredUsersPage.tsx
 * صفحة عرض جميع المستخدمين المسجلين مع بياناتهم و slugs + تبويب تحليلات + حذف حسابات
 */

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Users, Search, RefreshCw, ExternalLink, CheckCircle, 
  XCircle, Clock, Building2, User, Phone, Mail, Globe, 
  CreditCard, Calendar, Trash2, BarChart3, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import RegisteredUsersAnalytics from "@/components/analytics/RegisteredUsersAnalytics";

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

const RegisteredUsersPage: React.FC = () => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RegisteredUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    publishedCards: 0,
    unpublishedCards: 0,
    noCards: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: cards, error: cardsError } = await supabase
        .from("business_cards")
        .select("user_id, slug, published, created_at, data");

      if (cardsError) throw cardsError;

      // جلب عدد العروض لكل مستخدم
      const { data: listings } = await supabase
        .from("platform_listings")
        .select("user_id");

      // جلب عدد العملاء لكل مستخدم
      const { data: customers } = await supabase
        .from("crm_customers")
        .select("user_id");

      // جلب عدد المواعيد لكل مستخدم
      const { data: appointments } = await supabase
        .from("calendar_appointments")
        .select("user_id");

      // حساب العدد لكل مستخدم
      const listingsCounts: Record<string, number> = {};
      (listings || []).forEach(l => {
        if (l.user_id) listingsCounts[l.user_id] = (listingsCounts[l.user_id] || 0) + 1;
      });

      const customersCounts: Record<string, number> = {};
      (customers || []).forEach(c => {
        customersCounts[c.user_id] = (customersCounts[c.user_id] || 0) + 1;
      });

      const appointmentsCounts: Record<string, number> = {};
      (appointments || []).forEach(a => {
        if (a.user_id) appointmentsCounts[a.user_id] = (appointmentsCounts[a.user_id] || 0) + 1;
      });

      const mergedUsers: RegisteredUser[] = (profiles || []).map(profile => {
        const card = cards?.find(c => c.user_id === profile.user_id);
        const cardData = card?.data as Record<string, any> | null;
        
        return {
          user_id: profile.user_id,
          full_name: profile.full_name || cardData?.userName || cardData?.name || null,
          phone: profile.phone || cardData?.primaryPhone || null,
          email: cardData?.email || null,
          account_type: profile.account_type || cardData?.accountType || null,
          fal_license_number: profile.fal_license_number || cardData?.fal_license || null,
          company_name: profile.company_name || cardData?.companyName || null,
          profile_created: profile.created_at,
          slug: card?.slug || null,
          published: card?.published || false,
          card_created: card?.created_at || null,
          card_data: cardData,
          listings_count: listingsCounts[profile.user_id] || 0,
          customers_count: customersCounts[profile.user_id] || 0,
          appointments_count: appointmentsCounts[profile.user_id] || 0,
        };
      });

      setUsers(mergedUsers);

      const published = mergedUsers.filter(u => u.published).length;
      const unpublished = mergedUsers.filter(u => u.slug && !u.published).length;
      const noCards = mergedUsers.filter(u => !u.slug).length;

      setStats({
        totalUsers: mergedUsers.length,
        publishedCards: published,
        unpublishedCards: unpublished,
        noCards: noCards
      });

    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("يجب تسجيل الدخول");
        return;
      }

      const response = await supabase.functions.invoke("delete-user-account", {
        body: { user_id: deleteTarget.user_id }
      });

      if (response.error) {
        throw new Error(response.error.message || "فشل حذف الحساب");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`تم حذف حساب "${deleteTarget.full_name || 'بدون اسم'}" بنجاح`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "فشل حذف الحساب");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.full_name?.toLowerCase() || "").includes(query) ||
      (user.slug?.toLowerCase() || "").includes(query) ||
      (user.phone || "").includes(query) ||
      (user.email?.toLowerCase() || "").includes(query) ||
      (user.fal_license_number || "").includes(query) ||
      (user.company_name?.toLowerCase() || "").includes(query)
    );
  });

  const getAccountTypeLabel = (type: string | null) => {
    switch (type) {
      case "individual": return "فرد";
      case "office": return "مكتب";
      case "company": return "شركة";
      default: return type || "غير محدد";
    }
  };

  const getAccountTypeIcon = (type: string | null) => {
    switch (type) {
      case "company":
      case "office":
        return <Building2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const openPublicCard = (slug: string) => {
    window.open(`https://wasataai.com/${slug}/card`, "_blank");
  };

  const openPublicPlatform = (slug: string) => {
    window.open(`https://wasataai.com/${slug}`, "_blank");
  };

  return (
    <OwnerDashboardLayout
      title="المستخدمين المسجلين"
      icon={<Users className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchUsers}
      isLoading={loading}
    >
      <Tabs defaultValue="users" dir="rtl">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="users" className="flex-1 gap-1">
            <Users className="w-4 h-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 gap-1">
            <BarChart3 className="w-4 h-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* ====== تبويب المستخدمين ====== */}
        <TabsContent value="users">
          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-xs opacity-90">إجمالي المستخدمين</div>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.publishedCards}</div>
                <div className="text-xs opacity-90">بطاقات منشورة</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-600 text-white">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.unpublishedCards}</div>
                <div className="text-xs opacity-90">غير منشورة</div>
              </CardContent>
            </Card>
            <Card className="bg-muted text-muted-foreground">
              <CardContent className="p-4 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.noCards}</div>
                <div className="text-xs opacity-90">بدون بطاقة</div>
              </CardContent>
            </Card>
          </div>

          {/* البحث */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث بالاسم، الرابط، الجوال، الإيميل، رخصة فال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* قائمة المستخدمين */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد مستخدمين</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.user_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] flex items-center justify-center text-white">
                              {getAccountTypeIcon(user.account_type)}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground">
                                {user.full_name || "بدون اسم"}
                              </h3>
                              {user.company_name && (
                                <p className="text-xs text-muted-foreground">{user.company_name}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getAccountTypeLabel(user.account_type)}
                            </Badge>
                            {user.published ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle className="w-3 h-3 ml-1" />
                                منشور
                              </Badge>
                            ) : user.slug ? (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                <Clock className="w-3 h-3 ml-1" />
                                غير منشور
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground text-xs">
                                <XCircle className="w-3 h-3 ml-1" />
                                بدون بطاقة
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Activity badges */}
                        <div className="flex flex-wrap gap-1">
                          {(user.listings_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {user.listings_count} عرض
                            </Badge>
                          )}
                          {(user.customers_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {user.customers_count} عميل
                            </Badge>
                          )}
                          {(user.appointments_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {user.appointments_count} موعد
                            </Badge>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {user.slug && (
                            <div className="flex items-center gap-1 text-primary">
                              <Globe className="w-3 h-3" />
                              <span className="font-mono text-xs">{user.slug}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span className="text-xs" dir="ltr">{user.phone}</span>
                            </div>
                          )}
                          {user.email && (
                            <div className="flex items-center gap-1 text-muted-foreground truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs truncate">{user.email}</span>
                            </div>
                          )}
                          {user.fal_license_number && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CreditCard className="w-3 h-3" />
                              <span className="text-xs">{user.fal_license_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              انضم: {format(new Date(user.profile_created), "d MMM yyyy", { locale: ar })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {user.slug && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPublicCard(user.slug!)}
                                  className="text-xs h-7"
                                >
                                  <CreditCard className="w-3 h-3 ml-1" />
                                  البطاقة
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPublicPlatform(user.slug!)}
                                  className="text-xs h-7"
                                >
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                  المنصة
                                </Button>
                              </>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(user)}
                              className="text-xs h-7"
                            >
                              <Trash2 className="w-3 h-3 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* ====== تبويب التحليلات ====== */}
        <TabsContent value="analytics">
          <RegisteredUsersAnalytics users={users} />
        </TabsContent>
      </Tabs>

      {/* مستطيل تأكيد الحذف */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              تأكيد حذف الحساب
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <p>هل أنت متأكد من حذف حساب هذا المستخدم نهائياً؟</p>
              <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
                <p className="font-bold text-foreground">{deleteTarget?.full_name || "بدون اسم"}</p>
                {deleteTarget?.phone && <p className="text-sm" dir="ltr">{deleteTarget.phone}</p>}
                {deleteTarget?.email && <p className="text-sm">{deleteTarget.email}</p>}
                {deleteTarget?.slug && <p className="text-sm font-mono text-primary">{deleteTarget.slug}</p>}
              </div>
              <p className="text-destructive font-semibold">
                ⚠️ سيتم حذف جميع بيانات المستخدم بما فيها البطاقة والعروض والعملاء والمواعيد. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <RefreshCw className="w-4 h-4 animate-spin ml-1" />
              ) : (
                <Trash2 className="w-4 h-4 ml-1" />
              )}
              {deleting ? "جاري الحذف..." : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerDashboardLayout>
  );
};

export default RegisteredUsersPage;