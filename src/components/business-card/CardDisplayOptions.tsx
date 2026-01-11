/**
 * CardDisplayOptions.tsx
 * خيارات عرض البطاقة - إعدادات ما يظهر على البطاقة المطبوعة
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, User, Phone, Mail, MapPin, Languages, Briefcase } from 'lucide-react';

export interface DisplayOptions {
  // Name display
  nameDisplay: 'arabic' | 'arabic-english';
  nameEnglish: string;
  
  // Job title
  jobTitle: string;
  
  // Phone display
  phoneDisplay: 'phone-only' | 'phone-whatsapp';
  whatsappNumber: string;
  primaryNumber: 'phone' | 'whatsapp';
  
  // Optional fields visibility
  showEmail: boolean;
  showCity: boolean;
  showDistrict: boolean;
}

export const defaultDisplayOptions: DisplayOptions = {
  nameDisplay: 'arabic',
  nameEnglish: '',
  jobTitle: 'وسيط ومسوق عقاري',
  phoneDisplay: 'phone-only',
  whatsappNumber: '',
  primaryNumber: 'phone',
  showEmail: true,
  showCity: true,
  showDistrict: false,
};

interface CardDisplayOptionsProps {
  options: DisplayOptions;
  onChange: (options: DisplayOptions) => void;
  location?: string;
  district?: string;
}

export default function CardDisplayOptions({ 
  options, 
  onChange,
  location,
  district 
}: CardDisplayOptionsProps) {
  const handleChange = <K extends keyof DisplayOptions>(
    key: K, 
    value: DisplayOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Card className="border-2 border-[#D4AF37]/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#01411C] flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          🎨 إعدادات عرض البطاقة المطبوعة
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          تحكم في ما يظهر على بطاقة الأعمال الرسمية وترتيبه
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Display Options */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-[#01411C] font-medium">
            <User className="w-4 h-4" />
            طريقة عرض الاسم
          </Label>
          <RadioGroup
            value={options.nameDisplay}
            onValueChange={(value) => handleChange('nameDisplay', value as 'arabic' | 'arabic-english')}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="arabic" id="name-arabic" />
              <Label htmlFor="name-arabic" className="cursor-pointer text-sm">
                الاسم بالعربي فقط
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="arabic-english" id="name-both" />
              <Label htmlFor="name-both" className="cursor-pointer text-sm flex items-center gap-1">
                <Languages className="w-3 h-3" />
                الاسم بالعربي + الإنجليزي (الإنجليزي أصغر تحت العربي)
              </Label>
            </div>
          </RadioGroup>
          
          {options.nameDisplay === 'arabic-english' && (
            <div className="mr-6">
              <Label className="text-xs">الاسم بالإنجليزي</Label>
              <Input
                value={options.nameEnglish}
                onChange={(e) => handleChange('nameEnglish', e.target.value)}
                placeholder="Your Name in English"
                className="mt-1"
                dir="ltr"
              />
            </div>
          )}
        </div>

        <Separator className="bg-[#D4AF37]/20" />

        {/* Job Title */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-[#01411C] font-medium">
            <Briefcase className="w-4 h-4" />
            المسمى الوظيفي
          </Label>
          <Input
            value={options.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="وسيط ومسوق عقاري"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground">
            أمثلة: وسيط عقاري، مدير تنفيذي، مسوق عقاري، وسيط ومسوق عقاري
          </p>
        </div>

        <Separator className="bg-[#D4AF37]/20" />

        {/* Phone Display Options */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-[#01411C] font-medium">
            <Phone className="w-4 h-4" />
            أرقام التواصل
          </Label>
          <RadioGroup
            value={options.phoneDisplay}
            onValueChange={(value) => handleChange('phoneDisplay', value as 'phone-only' | 'phone-whatsapp')}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="phone-only" id="phone-only" />
              <Label htmlFor="phone-only" className="cursor-pointer text-sm">
                رقم الجوال فقط
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="phone-whatsapp" id="phone-whatsapp" />
              <Label htmlFor="phone-whatsapp" className="cursor-pointer text-sm">
                رقم الجوال + رقم الواتساب
              </Label>
            </div>
          </RadioGroup>

          {options.phoneDisplay === 'phone-whatsapp' && (
            <div className="mr-6 space-y-3">
              <div>
                <Label className="text-xs">رقم الواتساب</Label>
                <Input
                  value={options.whatsappNumber}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              
              <div>
                <Label className="text-xs mb-2 block">أيهما الرقم الرئيسي؟</Label>
                <RadioGroup
                  value={options.primaryNumber}
                  onValueChange={(value) => handleChange('primaryNumber', value as 'phone' | 'whatsapp')}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="phone" id="primary-phone" />
                    <Label htmlFor="primary-phone" className="cursor-pointer text-xs">الجوال</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="whatsapp" id="primary-whatsapp" />
                    <Label htmlFor="primary-whatsapp" className="cursor-pointer text-xs">الواتساب</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-[#D4AF37]/20" />

        {/* Optional Fields */}
        <div className="space-y-3">
          <Label className="text-[#01411C] font-medium">الحقول الاختيارية</Label>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm">عرض البريد الإلكتروني</span>
            </div>
            <Switch
              checked={options.showEmail}
              onCheckedChange={(checked) => handleChange('showEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm">عرض المدينة {location && `(${location})`}</span>
            </div>
            <Switch
              checked={options.showCity}
              onCheckedChange={(checked) => handleChange('showCity', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm">عرض الحي {district && `(${district})`}</span>
            </div>
            <Switch
              checked={options.showDistrict}
              onCheckedChange={(checked) => handleChange('showDistrict', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
