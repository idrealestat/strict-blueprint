/**
 * OwnerDashboard.tsx
 * لوحة تحكم المالك - نظام Feature Toggles ثلاثي الطبقات
 * 
 * A) Global Feature Visibility - الإعدادات العامة لجميع الحسابات
 * B) User Feature Overrides - استثناءات المستخدمين الفردية
 * C) Business Feature Control - قواعد حسابات الأعمال (مكتب/شركة)
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Shield, Check, X, Clock, Search, RefreshCw, Users, Settings,
  Crown, Globe, Lock, Unlock, UserCheck, ChevronLeft, Eye, EyeOff,
  Save, AlertTriangle, ArrowRight, Building2, User, Layers,
  ToggleLeft, ToggleRight
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { 
  FEATURE_FLAG_KEYS, 
  FEATURE_FLAG_LABELS, 
  FEATURE_CATEGORIES,
  FeatureFlags 
} from "@/context/FeatureFlagsContext";

// ============ INTERFACES ============
interface GlobalDefaults {
  id: string;
  [key: string]: boolean | string | null;
}

interface UserOverride {
  id: string;
  user_id: string;
  email: string | null;
  fal_license_number: string | null;
  notes: string | null;
  user_name?: string;
  account_type?: string;
  [key: string]: boolean | string | null | undefined;
}

interface BusinessRule {
  id: string;
  account_type: string;
  notes: string | null;
  [key: string]: boolean | string | null;
}

interface DomainRequest {
  id: string;
  user_id: string;
  requested_title: string;
  company_name: string | null;
  status: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  priority_level: number | null;
}

interface SlugRegistryEntry {
  id: string;
  slug: string;
  status: string;
  owner_user_id: string | null;
  reserve_to_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FirstNameException {
  id: string;
  first_name_normalized: string;
  allowed_user_id: string | null;
  allowed_email: string | null;
  is_enabled: boolean;
  notes: string | null;
}

// ============ COMPONENT ============
const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("global");
  const [isLoading, setIsLoading] = useState(true);
  
  // Layer 1: Global Defaults
  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults | null>(null);
  
  // Layer 2: User Overrides
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserOverride, setSelectedUserOverride] = useState<UserOverride | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  
  // Layer 3: Business Rules
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  
  // Legacy: Domain Requests
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");
  
  // Legacy: Slug Registry
  const [slugRegistry, setSlugRegistry] = useState<SlugRegistryEntry[]>([]);
  const [slugSearch, setSlugSearch] = useState("");
  const [slugFilter, setSlugFilter] = useState("all");
  
  // Legacy: First Name Exceptions
  const [exceptions, setExceptions] = useState<FirstNameException[]>([]);
  const [newException, setNewException] = useState({ name: "", notes: "" });
  
  // Dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: DomainRequest | null }>({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: DomainRequest | null; reason: string }>({ open: false, request: null, reason: "" });
  const [slugActionDialog, setSlugActionDialog] = useState<{ open: boolean; slug: SlugRegistryEntry | null; action: string }>({ open: false, slug: null, action: "" });

  // ============ FETCH DATA ============
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Layer 1: Global Defaults
      const { data: globalData } = await supabase
        .from('global_feature_defaults')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setGlobalDefaults(globalData);

      // Layer 2: User Overrides with user info
      const { data: overridesData } = await supabase
        .from('user_feature_overrides')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (overridesData) {
        // Get user info
        const userIds = overridesData.map(o => o.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, account_type')
          .in('user_id', userIds);
        
        const enrichedOverrides = overridesData.map(o => {
          const profile = profiles?.find(p => p.user_id === o.user_id);
          return {
            ...o,
            user_name: profile?.full_name || 'غير معروف',
            account_type: profile?.account_type || 'individual',
          };
        });
        setUserOverrides(enrichedOverrides);
      }

      // Layer 3: Business Rules
      const { data: businessData } = await supabase
        .from('business_feature_rules')
        .select('*');
      
      setBusinessRules(businessData || []);

      // Legacy: Domain Requests
      const { data: requestsData } = await supabase
        .from('domain_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      setRequests(requestsData || []);

      // Legacy: Slug Registry
      const { data: slugData } = await supabase
        .from('slug_registry')
        .select('*')
        .order('created_at', { ascending: false });
      
      setSlugRegistry(slugData || []);

      // Legacy: First Name Exceptions
      const { data: exceptionsData } = await supabase
        .from('slug_firstname_exceptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      setExceptions(exceptionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ LAYER 1: GLOBAL DEFAULTS ============
  const handleGlobalChange = async (key: string, value: boolean) => {
    if (!globalDefaults) return;
    
    try {
      const { error } = await supabase
        .from('global_feature_defaults')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', globalDefaults.id);

      if (error) throw error;

      setGlobalDefaults(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('تم تحديث الإعداد العام');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // ============ LAYER 2: USER OVERRIDES ============
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      // Search by email in business_cards
      const { data: cards } = await supabase
        .from('business_cards')
        .select('user_id, email, fal_license_number, data')
        .or(`email.ilike.%${query}%,fal_license_number.ilike.%${query}%`)
        .limit(10);

      // Search by name in profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, fal_license_number, account_type')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      // Merge results
      const results: any[] = [];
      const seenIds = new Set();

      cards?.forEach(card => {
        if (!seenIds.has(card.user_id)) {
          seenIds.add(card.user_id);
          const cardData = card.data as any;
          results.push({
            user_id: card.user_id,
            email: card.email || cardData?.email,
            fal_license_number: card.fal_license_number || cardData?.falLicenseNumber,
            name: cardData?.name || cardData?.userName,
          });
        }
      });

      profiles?.forEach(profile => {
        if (!seenIds.has(profile.user_id)) {
          seenIds.add(profile.user_id);
          results.push({
            user_id: profile.user_id,
            name: profile.full_name,
            fal_license_number: profile.fal_license_number,
            account_type: profile.account_type,
          });
        } else {
          // Merge name if found
          const existing = results.find(r => r.user_id === profile.user_id);
          if (existing && !existing.name) {
            existing.name = profile.full_name;
          }
        }
      });

      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSelectUserForOverride = async (userData: any) => {
    // Check if override already exists
    const existing = userOverrides.find(o => o.user_id === userData.user_id);
    if (existing) {
      setSelectedUserOverride(existing);
      setShowUserDialog(true);
      return;
    }

    // Create new override
    try {
      const { data, error } = await supabase
        .from('user_feature_overrides')
        .insert({
          user_id: userData.user_id,
          email: userData.email,
          fal_license_number: userData.fal_license_number,
        })
        .select()
        .single();

      if (error) throw error;

      const newOverride = {
        ...data,
        user_name: userData.name || 'غير معروف',
        account_type: userData.account_type || 'individual',
      };

      setUserOverrides(prev => [newOverride, ...prev]);
      setSelectedUserOverride(newOverride);
      setShowUserDialog(true);
      toast.success('تم إنشاء سجل استثناء للمستخدم');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleUserOverrideChange = async (userId: string, key: string, value: boolean | null) => {
    try {
      const { error } = await supabase
        .from('user_feature_overrides')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      setUserOverrides(prev => prev.map(o => 
        o.user_id === userId ? { ...o, [key]: value } : o
      ));
      
      if (selectedUserOverride?.user_id === userId) {
        setSelectedUserOverride(prev => prev ? { ...prev, [key]: value } : null);
      }
      
      toast.success('تم تحديث الاستثناء');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleDeleteUserOverride = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_feature_overrides')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setUserOverrides(prev => prev.filter(o => o.user_id !== userId));
      setShowUserDialog(false);
      setSelectedUserOverride(null);
      toast.success('تم حذف الاستثناء');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // ============ LAYER 3: BUSINESS RULES ============
  const handleBusinessRuleChange = async (accountType: string, key: string, value: boolean | null) => {
    try {
      const { error } = await supabase
        .from('business_feature_rules')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('account_type', accountType);

      if (error) throw error;

      setBusinessRules(prev => prev.map(r => 
        r.account_type === accountType ? { ...r, [key]: value } : r
      ));
      
      toast.success('تم تحديث قاعدة الأعمال');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // ============ LEGACY: DOMAIN REQUESTS ============
  const handleApproveRequest = async () => {
    if (!approveDialog.request) return;
    const request = approveDialog.request;

    try {
      const { error: updateError } = await supabase
        .from('domain_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      const { error: cardError } = await supabase
        .from('business_cards')
        .update({ slug: request.requested_title })
        .eq('user_id', request.user_id);

      if (cardError) throw cardError;

      const { error: registryError } = await supabase
        .from('slug_registry')
        .upsert({
          slug: request.requested_title,
          status: 'closed',
          owner_user_id: request.user_id,
          notes: 'تمت الموافقة عبر لوحة المالك'
        }, { onConflict: 'slug' });

      if (registryError) throw registryError;

      toast.success('تمت الموافقة على الطلب بنجاح');
      setApproveDialog({ open: false, request: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في الموافقة');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectDialog.request) return;

    try {
      const { error } = await supabase
        .from('domain_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectDialog.reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', rejectDialog.request.id);

      if (error) throw error;

      toast.success('تم رفض الطلب');
      setRejectDialog({ open: false, request: null, reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في الرفض');
    }
  };

  // ============ LEGACY: SLUG ACTIONS ============
  const handleSlugAction = async () => {
    if (!slugActionDialog.slug) return;
    const { slug, action } = slugActionDialog;

    try {
      let updateData: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'open':
          updateData.status = 'open';
          updateData.owner_user_id = null;
          updateData.reserve_to_user_id = null;
          break;
        case 'close':
          updateData.status = 'closed';
          break;
        case 'block':
          updateData.status = 'blocked';
          break;
      }

      const { error } = await supabase
        .from('slug_registry')
        .update(updateData)
        .eq('id', slug.id);

      if (error) throw error;

      toast.success('تم تحديث حالة الـ slug');
      setSlugActionDialog({ open: false, slug: null, action: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // ============ LEGACY: EXCEPTIONS ============
  const handleAddException = async () => {
    if (!newException.name.trim()) {
      toast.error('أدخل الاسم');
      return;
    }

    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .insert({
          first_name_normalized: newException.name.trim(),
          notes: newException.notes || null,
          is_enabled: true
        });

      if (error) throw error;

      toast.success('تم إضافة الاستثناء');
      setNewException({ name: "", notes: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleToggleException = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('slug_firstname_exceptions')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
      
      setExceptions(prev => prev.map(e => 
        e.id === id ? { ...e, is_enabled: enabled } : e
      ));
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // ============ FILTERS ============
  const filteredRequests = requests.filter(r => {
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    const matchesSearch = !requestSearch || 
      r.requested_title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(requestSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredSlugs = slugRegistry.filter(s => {
    const matchesFilter = slugFilter === 'all' || s.status === slugFilter;
    const matchesSearch = !slugSearch || s.slug.toLowerCase().includes(slugSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredOverrides = userOverrides.filter(o => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (o.email || '').toLowerCase().includes(search) ||
           (o.user_name || '').toLowerCase().includes(search) ||
           (o.fal_license_number || '').toLowerCase().includes(search);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">قيد الانتظار</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">مُعتمد</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">مرفوض</Badge>;
      case 'open': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">متاح</Badge>;
      case 'closed': return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">مغلق</Badge>;
      case 'reserved': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">محجوز</Badge>;
      case 'blocked': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">محظور</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ============ FEATURE TOGGLE COMPONENT ============
  const FeatureToggleRow = ({ 
    flagKey, 
    value, 
    globalValue,
    onChange,
    showDiffIndicator = false,
    triState = false
  }: { 
    flagKey: keyof FeatureFlags;
    value: boolean | null | undefined;
    globalValue?: boolean;
    onChange: (value: boolean | null) => void;
    showDiffIndicator?: boolean;
    triState?: boolean;
  }) => {
    const isDifferent = showDiffIndicator && value !== null && value !== undefined && value !== globalValue;
    
    if (triState) {
      // Three-state toggle: null (follow global), true, false
      const currentState = value === null || value === undefined ? 'global' : (value ? 'enabled' : 'disabled');
      
      return (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{FEATURE_FLAG_LABELS[flagKey]}</span>
            {isDifferent && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                مختلف
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={currentState} onValueChange={(v) => {
              if (v === 'global') onChange(null);
              else if (v === 'enabled') onChange(true);
              else onChange(false);
            }}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <span className="flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    اتباع العام
                  </span>
                </SelectItem>
                <SelectItem value="enabled">
                  <span className="flex items-center gap-2 text-green-600">
                    <Check className="w-3 h-3" />
                    مفعّل
                  </span>
                </SelectItem>
                <SelectItem value="disabled">
                  <span className="flex items-center gap-2 text-red-600">
                    <X className="w-3 h-3" />
                    معطّل
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
        <span className="text-sm font-medium">{FEATURE_FLAG_LABELS[flagKey]}</span>
        <Switch 
          checked={!!value} 
          onCheckedChange={onChange}
        />
      </div>
    );
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b-2 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/app/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">لوحة تحكم المالك</h1>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchData}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="global" className="flex items-center gap-1 text-xs">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات العامة</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">استثناءات المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-1 text-xs">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">قواعد الأعمال</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1 text-xs">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">طلبات Slugs</span>
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{requests.filter(r => r.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="slugs" className="flex items-center gap-1 text-xs">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">إدارة Slugs</span>
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-1 text-xs">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">استثناءات</span>
            </TabsTrigger>
          </TabsList>

          {/* =============== TAB: GLOBAL DEFAULTS (LAYER 1) =============== */}
          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#01411C]" />
                  الإعدادات العامة (Layer 1)
                </CardTitle>
                <CardDescription>
                  تحكم في الميزات المتاحة لجميع المستخدمين افتراضياً. هذه الإعدادات تطبق على:
                  <span className="font-medium"> الأفراد، المكاتب، الشركات، المستخدمين الجدد</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {globalDefaults ? (
                  <>
                    {/* Dashboard Features */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ToggleLeft className="w-4 h-4" />
                        ميزات لوحة التحكم
                      </h4>
                      <div className="space-y-1 border rounded-lg p-2">
                        {FEATURE_CATEGORIES.dashboard.map(key => (
                          <FeatureToggleRow
                            key={key}
                            flagKey={key}
                            value={globalDefaults[key] as boolean}
                            onChange={(v) => handleGlobalChange(key, v as boolean)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Left Slider */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ToggleLeft className="w-4 h-4" />
                        القائمة اليسرى
                      </h4>
                      <div className="space-y-1 border rounded-lg p-2">
                        {FEATURE_CATEGORIES.left_slider.map(key => (
                          <FeatureToggleRow
                            key={key}
                            flagKey={key}
                            value={globalDefaults[key] as boolean}
                            onChange={(v) => handleGlobalChange(key, v as boolean)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right Slider */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ToggleRight className="w-4 h-4" />
                        القائمة اليمنى
                      </h4>
                      <div className="space-y-1 border rounded-lg p-2">
                        {FEATURE_CATEGORIES.right_slider.map(key => (
                          <FeatureToggleRow
                            key={key}
                            flagKey={key}
                            value={globalDefaults[key] as boolean}
                            onChange={(v) => handleGlobalChange(key, v as boolean)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Business Card */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        بطاقة الأعمال
                      </h4>
                      <div className="space-y-1 border rounded-lg p-2">
                        {FEATURE_CATEGORIES.business_card.map(key => (
                          <div key={key}>
                            <FeatureToggleRow
                              flagKey={key}
                              value={globalDefaults[key] as boolean}
                              onChange={(v) => handleGlobalChange(key, v as boolean)}
                            />
                            {/* Info note for official_business_card_enabled */}
                            {key === 'official_business_card_enabled' && (
                              <div className="mx-3 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                <p className="font-medium mb-1">📍 أماكن ظهور/إخفاء هذه الميزة:</p>
                                <ul className="list-disc mr-4 space-y-0.5">
                                  <li>القائمة اليمنى: معاينة البطاقة الرسمية المصغرة</li>
                                  <li>صفحة تحرير البطاقة: تبويب "البطاقة" لإعدادات الطباعة</li>
                                  <li>صفحة البطاقة الرسمية المستقلة</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    جاري التحميل...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== TAB: USER OVERRIDES (LAYER 2) =============== */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#01411C]" />
                  استثناءات المستخدمين (Layer 2)
                </CardTitle>
                <CardDescription>
                  إنشاء استثناءات لمستخدمين محددين. <span className="font-medium text-amber-600">الأولوية الأعلى</span> - تتجاوز الإعدادات العامة وقواعد الأعمال
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search for user */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="ابحث بالإيميل أو رخصة فال أو الاسم..."
                      className="pr-10"
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        searchUsers(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Search Results */}
                {userSearchResults.length > 0 && (
                  <div className="border rounded-lg p-2 space-y-1 bg-blue-50">
                    <p className="text-xs text-blue-600 mb-2">نتائج البحث - اضغط لإضافة استثناء:</p>
                    {userSearchResults.map(user => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectUserForOverride(user)}
                      >
                        <div>
                          <p className="font-medium text-sm">{user.name || 'غير معروف'}</p>
                          <p className="text-xs text-gray-500">{user.email || user.fal_license_number}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Overrides */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">الاستثناءات الحالية ({filteredOverrides.length})</h4>
                  {filteredOverrides.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      لا توجد استثناءات. ابحث عن مستخدم لإضافة استثناء.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOverrides.map(override => (
                        <div
                          key={override.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedUserOverride(override);
                            setShowUserDialog(true);
                          }}
                        >
                          <div>
                            <p className="font-medium">{override.user_name}</p>
                            <p className="text-xs text-gray-500">{override.email || override.fal_license_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {override.account_type === 'office' ? 'مكتب' : 
                               override.account_type === 'company' ? 'شركة' : 'فرد'}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== TAB: BUSINESS RULES (LAYER 3) =============== */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#01411C]" />
                  قواعد حسابات الأعمال (Layer 3)
                </CardTitle>
                <CardDescription>
                  تحكم في الميزات الخاصة بحسابات المكاتب والشركات. تطبق فقط عندما لا يوجد استثناء للمستخدم.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {businessRules.map(rule => (
                  <div key={rule.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      {rule.account_type === 'office' ? (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Building2 className="w-5 h-5 text-purple-600" />
                      )}
                      <h4 className="font-bold">
                        {rule.account_type === 'office' ? 'المكاتب العقارية' : 'الشركات'}
                      </h4>
                    </div>
                    
                    <div className="border rounded-lg p-3 space-y-1">
                      {FEATURE_FLAG_KEYS.map(key => (
                        <FeatureToggleRow
                          key={key}
                          flagKey={key}
                          value={rule[key] as boolean | null}
                          globalValue={globalDefaults?.[key] as boolean}
                          onChange={(v) => handleBusinessRuleChange(rule.account_type, key, v)}
                          showDiffIndicator
                          triState
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== TAB: DOMAIN REQUESTS =============== */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#01411C]" />
                  طلبات الـ Slugs
                </CardTitle>
                <CardDescription>مراجعة والموافقة على طلبات النطاقات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="بحث بالنطاق أو اسم الشركة..."
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={requestFilter} onValueChange={setRequestFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="فلترة بالحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">النطاق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            لا توجد طلبات
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRequests.map(request => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requested_title}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                    onClick={() => setApproveDialog({ open: true, request })}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => setRejectDialog({ open: true, request, reason: "" })}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
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

          {/* =============== TAB: SLUG MANAGEMENT =============== */}
          <TabsContent value="slugs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#01411C]" />
                  إدارة الـ Slugs
                </CardTitle>
                <CardDescription>عرض وإدارة جميع النطاقات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="بحث بالنطاق..."
                      value={slugSearch}
                      onChange={(e) => setSlugSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={slugFilter} onValueChange={setSlugFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="فلترة بالحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="open">متاح</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                      <SelectItem value="reserved">محجوز</SelectItem>
                      <SelectItem value="blocked">محظور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">النطاق</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSlugs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            لا توجد نطاقات
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSlugs.map(slug => (
                          <TableRow key={slug.id}>
                            <TableCell className="font-medium font-mono">{slug.slug}</TableCell>
                            <TableCell>{getStatusBadge(slug.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(slug.created_at).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {slug.status !== 'open' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 text-xs"
                                    onClick={() => setSlugActionDialog({ open: true, slug, action: 'open' })}
                                  >
                                    <Unlock className="w-3 h-3" />
                                  </Button>
                                )}
                                {slug.status !== 'closed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-gray-600 text-xs"
                                    onClick={() => setSlugActionDialog({ open: true, slug, action: 'close' })}
                                  >
                                    <Lock className="w-3 h-3" />
                                  </Button>
                                )}
                                {slug.status !== 'blocked' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 text-xs"
                                    onClick={() => setSlugActionDialog({ open: true, slug, action: 'block' })}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
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

          {/* =============== TAB: FIRST NAME EXCEPTIONS =============== */}
          <TabsContent value="exceptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#01411C]" />
                  استثناءات الاسم الأول
                </CardTitle>
                <CardDescription>إدارة الأسماء المستثناة من قاعدة رفض الاسم الأول</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="الاسم الأول..."
                    value={newException.name}
                    onChange={(e) => setNewException(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="ملاحظات (اختياري)..."
                    value={newException.notes}
                    onChange={(e) => setNewException(prev => ({ ...prev, notes: e.target.value }))}
                    className="flex-1"
                  />
                  <Button onClick={handleAddException} className="bg-[#01411C] hover:bg-[#065f41]">
                    إضافة
                  </Button>
                </div>

                <div className="space-y-2">
                  {exceptions.map(exception => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{exception.first_name_normalized}</p>
                        {exception.notes && (
                          <p className="text-xs text-gray-500">{exception.notes}</p>
                        )}
                      </div>
                      <Switch
                        checked={exception.is_enabled}
                        onCheckedChange={(v) => handleToggleException(exception.id, v)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* =============== DIALOGS =============== */}
      
      {/* User Override Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              استثناءات المستخدم
            </DialogTitle>
            <DialogDescription>
              {selectedUserOverride?.user_name} - {selectedUserOverride?.email || selectedUserOverride?.fal_license_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserOverride && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {FEATURE_FLAG_KEYS.map(key => (
                <FeatureToggleRow
                  key={key}
                  flagKey={key}
                  value={selectedUserOverride[key] as boolean | null}
                  globalValue={globalDefaults?.[key] as boolean}
                  onChange={(v) => handleUserOverrideChange(selectedUserOverride.user_id, key, v)}
                  showDiffIndicator
                  triState
                />
              ))}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedUserOverride && handleDeleteUserOverride(selectedUserOverride.user_id)}
            >
              حذف الاستثناء
            </Button>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(v) => !v && setApproveDialog({ open: false, request: null })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الموافقة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من الموافقة على النطاق: <span className="font-bold">{approveDialog.request?.requested_title}</span>؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>
              إلغاء
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveRequest}>
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(v) => !v && setRejectDialog({ open: false, request: null, reason: "" })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>
              رفض النطاق: <span className="font-bold">{rejectDialog.request?.requested_title}</span>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="سبب الرفض..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null, reason: "" })}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleRejectRequest}>
              رفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slug Action Dialog */}
      <Dialog open={slugActionDialog.open} onOpenChange={(v) => !v && setSlugActionDialog({ open: false, slug: null, action: "" })}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {slugActionDialog.action === 'open' && 'فتح النطاق'}
              {slugActionDialog.action === 'close' && 'إغلاق النطاق'}
              {slugActionDialog.action === 'block' && 'حظر النطاق'}
            </DialogTitle>
            <DialogDescription>
              النطاق: <span className="font-bold font-mono">{slugActionDialog.slug?.slug}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugActionDialog({ open: false, slug: null, action: "" })}>
              إلغاء
            </Button>
            <Button 
              className={slugActionDialog.action === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#01411C] hover:bg-[#065f41]'}
              onClick={handleSlugAction}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
