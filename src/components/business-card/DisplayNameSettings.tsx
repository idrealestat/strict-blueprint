/**
 * DisplayNameSettings.tsx
 * مكون إعدادات اسم العرض في المستندات المالية
 */

import { FileText, User, Building2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DisplayNameSettingsProps {
  displayNameType: 'personal' | 'company' | 'platform';
  platformNameArabic: string;
  userName: string;
  companyName: string;
  userTitle: string; // slug
  onChange: (type: 'personal' | 'company' | 'platform', platformName?: string) => void;
}

export default function DisplayNameSettings({
  displayNameType,
  platformNameArabic,
  userName,
  companyName,
  userTitle,
  onChange,
}: DisplayNameSettingsProps) {
  return (
    <Card className="border-[#D4AF37]/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#01411C] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#D4AF37]" />
          الاسم المعروض في المستندات المالية
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          اختر الاسم الذي يظهر في عروض الأسعار وسندات القبض
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Personal Name */}
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            displayNameType === 'personal' 
              ? 'border-[#01411C] bg-[#01411C]/5' 
              : 'border-gray-200 hover:border-[#D4AF37]'
          }`}
          onClick={() => onChange('personal')}
        >
          <input
            type="radio"
            id="displayName-personal"
            name="displayNameType"
            value="personal"
            checked={displayNameType === 'personal'}
            onChange={() => onChange('personal')}
            className="w-4 h-4 accent-[#01411C]"
          />
          <User className="w-5 h-5 text-[#01411C]" />
          <div className="flex-1">
            <label htmlFor="displayName-personal" className="text-sm font-medium cursor-pointer">
              اسمي الشخصي
            </label>
            <p className="text-xs text-muted-foreground">
              {userName || 'لم يُحدد'}
            </p>
          </div>
        </div>

        {/* Company Name */}
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            displayNameType === 'company' 
              ? 'border-[#01411C] bg-[#01411C]/5' 
              : 'border-gray-200 hover:border-[#D4AF37]'
          }`}
          onClick={() => onChange('company')}
        >
          <input
            type="radio"
            id="displayName-company"
            name="displayNameType"
            value="company"
            checked={displayNameType === 'company'}
            onChange={() => onChange('company')}
            className="w-4 h-4 accent-[#01411C]"
          />
          <Building2 className="w-5 h-5 text-[#D4AF37]" />
          <div className="flex-1">
            <label htmlFor="displayName-company" className="text-sm font-medium cursor-pointer">
              اسم الشركة / المكتب
            </label>
            <p className="text-xs text-muted-foreground">
              {companyName || 'لم يُحدد'}
            </p>
          </div>
        </div>

        {/* Platform Name */}
        <div 
          className={`p-3 rounded-lg border-2 transition-all ${
            displayNameType === 'platform' 
              ? 'border-[#01411C] bg-[#01411C]/5' 
              : 'border-gray-200 hover:border-[#D4AF37]'
          }`}
        >
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onChange('platform', platformNameArabic)}
          >
            <input
              type="radio"
              id="displayName-platform"
              name="displayNameType"
              value="platform"
              checked={displayNameType === 'platform'}
              onChange={() => onChange('platform', platformNameArabic)}
              className="w-4 h-4 accent-[#01411C]"
            />
            <Globe className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <label htmlFor="displayName-platform" className="text-sm font-medium cursor-pointer">
                اسم المنصة بالعربية
              </label>
              <p className="text-xs text-muted-foreground">
                للأفراد والمسوقين المستقلين
              </p>
            </div>
          </div>

          {displayNameType === 'platform' && (
            <div className="mt-3 mr-8">
              <Label className="text-xs">اكتب اسم منصتك بالعربية</Label>
              <Input
                value={platformNameArabic}
                onChange={(e) => onChange('platform', e.target.value)}
                placeholder={userTitle ? `مثال: ${userTitle}` : 'مثال: عقارات الرياض'}
                className="mt-1 border-[#D4AF37]/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 يُفضل أن يكون مشابهاً لرابط منصتك ({userTitle || 'الرابط'})
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mt-4 p-3 bg-gradient-to-r from-[#01411C]/10 to-[#D4AF37]/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">سيظهر في المستندات:</p>
          <p className="font-bold text-[#01411C]">
            {displayNameType === 'personal' && (userName || 'اسمك الشخصي')}
            {displayNameType === 'company' && (companyName || 'اسم الشركة')}
            {displayNameType === 'platform' && (platformNameArabic || userTitle || 'اسم المنصة')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * دالة مساعدة لجلب الاسم المعروض
 */
export function getDisplayName(
  displayNameType: 'personal' | 'company' | 'platform',
  userName: string,
  companyName: string,
  platformNameArabic: string
): string {
  switch (displayNameType) {
    case 'personal':
      return userName || 'وسيط عقاري';
    case 'company':
      return companyName || userName || 'شركة عقارية';
    case 'platform':
      return platformNameArabic || userName || 'منصة عقارية';
    default:
      return userName || 'وسيط عقاري';
  }
}
