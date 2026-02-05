/**
 * UserOverridesPage.tsx
 * صفحة استثناءات المستخدمين (Layer 2)
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Search, Globe, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import { 
  FEATURE_FLAG_KEYS, 
  FEATURE_FLAG_LABELS, 
  FeatureFlags 
} from "@/context/FeatureFlagsContext";

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

const UserOverridesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults | null>(null);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserOverride, setSelectedUserOverride] = useState<UserOverride | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Global Defaults
      const { data: globalData } = await supabase
        .from('global_feature_defaults')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setGlobalDefaults(globalData);

      // User Overrides
      const { data: overridesData } = await supabase
        .from('user_feature_overrides')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (overridesData) {
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

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      const { data: cards } = await supabase
        .from('business_cards')
        .select('user_id, email, fal_license_number, data')
        .or(`email.ilike.%${query}%,fal_license_number.ilike.%${query}%`)
        .limit(10);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, fal_license_number, account_type')
        .ilike('full_name', `%${query}%`)
        .limit(10);

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
    const existing = userOverrides.find(o => o.user_id === userData.user_id);
    if (existing) {
      setSelectedUserOverride(existing);
      setShowUserDialog(true);
      return;
    }

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

  const filteredOverrides = userOverrides.filter(o => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (o.email || '').toLowerCase().includes(search) ||
           (o.user_name || '').toLowerCase().includes(search) ||
           (o.fal_license_number || '').toLowerCase().includes(search);
  });

  // Feature Toggle Row with Tri-State
  const FeatureToggleRow = ({ 
    flagKey, 
    value, 
    globalValue,
    onChange,
  }: { 
    flagKey: keyof FeatureFlags;
    value: boolean | null | undefined;
    globalValue?: boolean;
    onChange: (value: boolean | null) => void;
  }) => {
    const isDifferent = value !== null && value !== undefined && value !== globalValue;
    const currentState = value === null || value === undefined ? 'global' : (value ? 'enabled' : 'disabled');
    
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-all">
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
  };

  return (
    <OwnerDashboardLayout
      title="استثناءات المستخدمين"
      icon={<User className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
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
              {FEATURE_FLAG_KEYS.map((key) => (
                <FeatureToggleRow
                  key={key}
                  flagKey={key}
                  value={selectedUserOverride[key] as boolean | null}
                  globalValue={globalDefaults?.[key] as boolean}
                  onChange={(v) => handleUserOverrideChange(selectedUserOverride.user_id, key, v)}
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
    </OwnerDashboardLayout>
  );
};

export default UserOverridesPage;
