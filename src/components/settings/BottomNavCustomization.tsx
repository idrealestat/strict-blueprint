/**
 * BottomNavCustomization.tsx
 * قسم تخصيص أزرار الشريط السفلي في الإعدادات
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Plus, 
  Megaphone, 
  Calculator, 
  Sparkles, 
  Calendar, 
  Component, 
  TrendingUp, 
  FileText,
  Users,
  Globe,
  BarChart3,
  RotateCcw,
  Lock,
  Settings2
} from 'lucide-react';
import { useBottomNavCustomization, BottomNavButtonId, BottomNavConfig } from '@/hooks/useBottomNavCustomization';
import { toast } from 'sonner';

// أيقونات الأزرار
const BUTTON_ICONS: Record<BottomNavButtonId, React.ElementType> = {
  'home': Home,
  'add-customer': Plus,
  'publish-ad': Megaphone,
  'quick-calculator': Calculator,
  'smart-opportunities': Sparkles,
  'calendar': Calendar,
  'my-platform': Component,
  'offers-tab': TrendingUp,
  'requests-tab': FileText,
  'market-analytics': BarChart3,
  'team-management': Users,
  'publishing-platforms': Globe,
};

interface BottomNavCustomizationProps {
  onBack?: () => void;
}

export default function BottomNavCustomization({ onBack }: BottomNavCustomizationProps) {
  const { 
    config, 
    updateButton, 
    resetToDefault, 
    getAvailableButtonsForPosition,
    getButtonInfo,
    isButtonHidden,
    AVAILABLE_BUTTONS
  } = useBottomNavCustomization();

  const handleReset = () => {
    resetToDefault();
    toast.success('تم استعادة الإعدادات الافتراضية');
  };

  const positions: { key: keyof BottomNavConfig; label: string; isFixed: boolean }[] = [
    { key: 'right', label: 'أقصى اليمين', isFixed: true },
    { key: 'right-center', label: 'يمين الوسط', isFixed: false },
    { key: 'center', label: 'الوسط', isFixed: true },
    { key: 'left-center', label: 'يسار الوسط', isFixed: false },
    { key: 'left', label: 'أقصى اليسار', isFixed: false },
  ];

  const renderPositionSelector = (position: { key: keyof BottomNavConfig; label: string; isFixed: boolean }) => {
    const currentButtonId = config[position.key];
    const buttonInfo = getButtonInfo(currentButtonId);
    const Icon = buttonInfo ? BUTTON_ICONS[currentButtonId] : Settings2;
    const availableButtons = getAvailableButtonsForPosition(position.key);
    const isHidden = isButtonHidden(currentButtonId);

    return (
      <div key={position.key} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            position.key === 'center' 
              ? 'bg-[#D4AF37]' 
              : 'bg-[#01411C]/20 border border-[#01411C]/30'
          }`}>
            <Icon className={`w-4 h-4 ${position.key === 'center' ? 'text-[#01411C]' : 'text-[#01411C]'}`} />
          </div>
          <span className="text-sm font-medium">{position.label}</span>
        </div>

        <div className="flex-1">
          {position.isFixed ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                {buttonInfo?.label || 'ثابت'}
              </Badge>
              <span className="text-xs text-muted-foreground">لا يمكن تغييره</span>
            </div>
          ) : (
            <Select
              value={currentButtonId}
              onValueChange={(value) => updateButton(position.key, value as BottomNavButtonId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{buttonInfo?.label}</span>
                    {isHidden && (
                      <Badge variant="destructive" className="text-xs">مخفي</Badge>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableButtons.map((btn) => {
                  const BtnIcon = BUTTON_ICONS[btn.id];
                  const btnHidden = isButtonHidden(btn.id);
                  return (
                    <SelectItem key={btn.id} value={btn.id} disabled={btnHidden}>
                      <div className="flex items-center gap-2">
                        <BtnIcon className="w-4 h-4" />
                        <span>{btn.label}</span>
                        {btnHidden && (
                          <Badge variant="outline" className="text-xs mr-2">معطل</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#D4AF37]" />
              تخصيص الشريط السفلي
            </CardTitle>
            <CardDescription className="mt-1">
              اختر الأزرار التي تريد ظهورها في الشريط السفلي للواجهة الرئيسية
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* معاينة الشريط */}
        <div className="p-4 bg-gradient-to-r from-[#01411C] via-[#065f41] to-[#01411C] rounded-lg border-2 border-[#D4AF37]">
          <div className="flex items-center justify-between" dir="rtl">
            {positions.map((pos) => {
              const buttonId = config[pos.key];
              const buttonInfo = getButtonInfo(buttonId);
              const Icon = buttonInfo ? BUTTON_ICONS[buttonId] : Settings2;
              const isCenter = pos.key === 'center';
              const isHidden = isButtonHidden(buttonId);
              
              if (isHidden) {
                return (
                  <div key={pos.key} className="flex flex-col items-center gap-1 px-2 opacity-30">
                    <div className="w-8 h-8 rounded-full bg-gray-500/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-[9px] text-gray-400">مخفي</span>
                  </div>
                );
              }
              
              return (
                <div key={pos.key} className="flex flex-col items-center gap-1 px-2">
                  <div className={`
                    flex items-center justify-center
                    ${isCenter 
                      ? 'w-10 h-10 rounded-full bg-[#D4AF37] shadow-lg' 
                      : 'w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50'
                    }
                  `}>
                    <Icon className={isCenter ? 'w-5 h-5 text-[#01411C]' : 'w-4 h-4 text-[#D4AF37]'} />
                  </div>
                  <span className={`text-[9px] ${isCenter ? 'text-white font-medium' : 'text-white/80'}`}>
                    {buttonInfo?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* قائمة المواضع */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">تخصيص الأزرار حسب الموضع</Label>
          {positions.map(renderPositionSelector)}
        </div>

        <Separator />

        {/* ملاحظة */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>ملاحظة:</strong> بعض الأزرار قد تكون مخفية إذا تم تعطيل الميزة المرتبطة بها من لوحة التحكم.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
