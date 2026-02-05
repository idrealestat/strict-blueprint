/**
 * GlobalSettingsPage.tsx
 * صفحة الإعدادات العامة (Layer 1)
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, ToggleLeft, ToggleRight, UserCheck, Eye, Settings, User, Users, PhoneCall, LayoutGrid, Plus, Edit, Trash2, Brain, Link2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import OwnerDashboardLayout from "./OwnerDashboardLayout";
import FloatingBubbleOwnerControl from "@/components/settings/FloatingBubbleOwnerControl";
import { 
  FEATURE_FLAG_KEYS, 
  FEATURE_FLAG_LABELS, 
  FEATURE_CATEGORIES,
  FeatureFlags 
} from "@/context/FeatureFlagsContext";

interface GlobalDefaults {
  id: string;
  [key: string]: boolean | string | null;
}

// Custom Column Interface
interface CustomColumn {
  id: string;
  title: string;
  color: string;
}

// Smart Assistant Settings Card
const SmartAssistantSettingsCard: React.FC = () => {
  const [assistantVisible, setAssistantVisible] = useState(() => {
    return localStorage.getItem('smart_assistant_visible') !== 'false';
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('voice_features_enabled') !== 'false';
  });
  const [voiceType, setVoiceType] = useState<'male' | 'female'>(() => {
    return (localStorage.getItem('voice_type') as 'male' | 'female') || 'male';
  });

  const handleAssistantToggle = (checked: boolean) => {
    setAssistantVisible(checked);
    localStorage.setItem('smart_assistant_visible', checked.toString());
    window.dispatchEvent(new CustomEvent('smartAssistantSettingsChanged'));
  };

  const handleVoiceToggle = (checked: boolean) => {
    setVoiceEnabled(checked);
    localStorage.setItem('voice_features_enabled', checked.toString());
    window.dispatchEvent(new CustomEvent('voiceSettingsChanged'));
  };

  const handleVoiceTypeChange = (value: 'male' | 'female') => {
    setVoiceType(value);
    localStorage.setItem('voice_type', value);
    window.dispatchEvent(new CustomEvent('voiceSettingsChanged'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#D4AF37]" />
          إعدادات المساعد الذكي
        </CardTitle>
        <CardDescription>التحكم في ظهور المساعد الذكي وميزات الصوت</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              إظهار المساعد الذكي
            </p>
            <p className="text-sm text-gray-500">عرض زر المساعد الذكي في جميع الصفحات</p>
          </div>
          <Switch
            checked={assistantVisible}
            onCheckedChange={handleAssistantToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              تفعيل ميزات الصوت
            </p>
            <p className="text-sm text-gray-500">إرسال واستقبال الرسائل الصوتية</p>
          </div>
          <Switch
            checked={voiceEnabled}
            onCheckedChange={handleVoiceToggle}
          />
        </div>

        {voiceEnabled && (
          <div className="p-4 border rounded-lg space-y-3">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              نوع صوت الرد
            </Label>
            <Select value={voiceType} onValueChange={handleVoiceTypeChange}>
              <SelectTrigger className="w-full max-w-[200px]">
                <SelectValue placeholder="اختر نوع الصوت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">صوت رجل</SelectItem>
                <SelectItem value="female">صوت امرأة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Customer Management Settings Card
const CustomerManagementSettingsCard: React.FC = () => {
  const [recentCallsVisible, setRecentCallsVisible] = useState(() => {
    return localStorage.getItem('recent_calls_visible') !== 'false';
  });
  
  const [isCallLogsLinkingEnabled, setIsCallLogsLinkingEnabled] = useState(() => {
    return localStorage.getItem('call_logs_linking_enabled') === 'true';
  });
  const [isEnablingLinking, setIsEnablingLinking] = useState(false);
  
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>(() => {
    const saved = localStorage.getItem('crm_custom_columns');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  
  useEffect(() => {
    const handleLinkingChanged = () => {
      setIsCallLogsLinkingEnabled(localStorage.getItem('call_logs_linking_enabled') === 'true');
    };
    window.addEventListener('callLogsLinkingChanged', handleLinkingChanged);
    return () => window.removeEventListener('callLogsLinkingChanged', handleLinkingChanged);
  }, []);

  const handleRecentCallsToggle = (checked: boolean) => {
    setRecentCallsVisible(checked);
    localStorage.setItem('recent_calls_visible', checked.toString());
    window.dispatchEvent(new CustomEvent('crmSettingsChanged'));
    toast.success(checked ? 'تم تفعيل عرض الاتصالات الأخيرة' : 'تم إخفاء الاتصالات الأخيرة');
  };
  
  const handleCallLogsLinkingToggle = async (checked: boolean) => {
    if (checked) {
      setIsEnablingLinking(true);
      localStorage.setItem('call_logs_linking_enabled', 'true');
      setIsCallLogsLinkingEnabled(true);
      window.dispatchEvent(new CustomEvent('callLogsLinkingChanged'));
      toast.success('تم تفعيل ربط الاتصالات');
      setIsEnablingLinking(false);
    } else {
      localStorage.setItem('call_logs_linking_enabled', 'false');
      setIsCallLogsLinkingEnabled(false);
      window.dispatchEvent(new CustomEvent('callLogsLinkingChanged'));
      toast.success('تم إيقاف ربط الاتصالات');
    }
  };
  
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast.error('يرجى إدخال اسم العمود');
      return;
    }
    
    const newColumn: CustomColumn = {
      id: `custom_${Date.now()}`,
      title: newColumnTitle.trim(),
      color: '#6366f1',
    };
    
    const updatedColumns = [...customColumns, newColumn];
    setCustomColumns(updatedColumns);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedColumns));
    window.dispatchEvent(new CustomEvent('crmColumnsChanged'));
    
    setNewColumnTitle('');
    setShowAddColumn(false);
    toast.success('تم إضافة العمود بنجاح');
  };
  
  const handleEditColumn = () => {
    if (!editingColumn || !editColumnTitle.trim()) {
      toast.error('يرجى إدخال اسم العمود');
      return;
    }
    
    const updatedColumns = customColumns.map(col => 
      col.id === editingColumn.id ? { ...col, title: editColumnTitle.trim() } : col
    );
    setCustomColumns(updatedColumns);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedColumns));
    window.dispatchEvent(new CustomEvent('crmColumnsChanged'));
    
    setEditingColumn(null);
    setEditColumnTitle('');
    toast.success('تم تعديل اسم العمود');
  };
  
  const handleDeleteColumn = (columnId: string) => {
    const updatedColumns = customColumns.filter(col => col.id !== columnId);
    setCustomColumns(updatedColumns);
    localStorage.setItem('crm_custom_columns', JSON.stringify(updatedColumns));
    window.dispatchEvent(new CustomEvent('crmColumnsChanged'));
    toast.success('تم حذف العمود');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#01411C]" />
          إدارة العملاء
        </CardTitle>
        <CardDescription>التحكم في إعدادات نظام إدارة العملاء (CRM)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border-2 border-violet-200 rounded-lg bg-gradient-to-r from-violet-50 to-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-violet-600" />
                ربط الاتصالات الأخيرة
              </p>
              <p className="text-sm text-gray-500">ربط سجل المكالمات بعملائك تلقائياً</p>
            </div>
            <Switch
              checked={isCallLogsLinkingEnabled}
              onCheckedChange={handleCallLogsLinkingToggle}
              disabled={isEnablingLinking}
            />
          </div>
          
          {isCallLogsLinkingEnabled && (
            <div className="text-xs text-violet-600 bg-violet-100 p-2 rounded-md flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>المعالجة محلية فقط • لا إرسال للسيرفر • لا تخزين دائم</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              عرض الاتصالات الأخيرة
            </p>
            <p className="text-sm text-gray-500">إظهار قسم الاتصالات الأخيرة في نظام إدارة العملاء</p>
          </div>
          <Switch
            checked={recentCallsVisible}
            onCheckedChange={handleRecentCallsToggle}
          />
        </div>
        
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                الأعمدة المخصصة
              </p>
              <p className="text-sm text-gray-500">إضافة أعمدة جديدة لنظام إدارة العملاء</p>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddColumn(true)}
              className="bg-[#01411C] hover:bg-[#016630]"
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة عمود
            </Button>
          </div>
          
          {customColumns.length > 0 && (
            <div className="space-y-2 mt-3">
              {customColumns.map((column) => (
                <div 
                  key={column.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="font-medium">{column.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingColumn(column);
                        setEditColumnTitle(column.title);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteColumn(column.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {customColumns.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              لا توجد أعمدة مخصصة. اضغط على "إضافة عمود" لإنشاء عمود جديد.
            </p>
          )}
        </div>
        
        <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عمود جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="column-title">اسم العمود</Label>
                <Input
                  id="column-title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="مثال: متابعة، مؤجل، VIP..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddColumn(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddColumn} className="bg-[#01411C] hover:bg-[#016630]">
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل اسم العمود</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-column-title">اسم العمود</Label>
                <Input
                  id="edit-column-title"
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  placeholder="أدخل الاسم الجديد..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingColumn(null)}>
                إلغاء
              </Button>
              <Button onClick={handleEditColumn} className="bg-[#01411C] hover:bg-[#016630]">
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Feature Toggle Row Component
const FeatureToggleRow = ({ 
  flagKey, 
  value, 
  onChange,
}: { 
  flagKey: keyof FeatureFlags;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
}) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-all">
      <span className="text-sm font-medium">{FEATURE_FLAG_LABELS[flagKey]}</span>
      <Switch 
        checked={!!value} 
        onCheckedChange={onChange}
      />
    </div>
  );
};

const GlobalSettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [globalDefaults, setGlobalDefaults] = useState<GlobalDefaults | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: globalData } = await supabase
        .from('global_feature_defaults')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setGlobalDefaults(globalData);
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

  const handleGlobalChange = async (key: string, value: boolean) => {
    if (!globalDefaults) return;

    try {
      const { error } = await supabase
        .from('global_feature_defaults')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', globalDefaults.id);

      if (error) throw error;

      setGlobalDefaults(prev => prev ? { ...prev, [key]: value } : null);
      toast.success(`تم ${value ? 'تفعيل' : 'تعطيل'} الميزة`);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  return (
    <OwnerDashboardLayout
      title="الإعدادات العامة"
      icon={<Globe className="w-5 h-5 text-[#D4AF37]" />}
      onRefresh={fetchData}
      isLoading={isLoading}
    >
      <div className="space-y-6">
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

        {/* Floating Bubble Owner Control */}
        {globalDefaults && (
          <FloatingBubbleOwnerControl 
            globalDefaults={globalDefaults} 
            onUpdate={fetchData} 
          />
        )}

        {/* Smart Assistant Settings */}
        <SmartAssistantSettingsCard />

        {/* Customer Management Settings */}
        <CustomerManagementSettingsCard />
      </div>
    </OwnerDashboardLayout>
  );
};

export default GlobalSettingsPage;
