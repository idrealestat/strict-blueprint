'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Phone, Mail, Globe, MessageCircle, Download, Share2, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  isPremium: boolean;
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'عصري',
    description: 'تصميم عصري وأنيق للمحترفين',
    primaryColor: '#01411C',
    secondaryColor: '#D4AF37',
    isPremium: false,
  },
  {
    id: 'luxury',
    name: 'فاخر',
    description: 'مخصص للوسطاء العقاريين',
    primaryColor: '#1a1a1a',
    secondaryColor: '#DAA520',
    isPremium: true,
  },
  {
    id: 'minimal',
    name: 'بسيط',
    description: 'تصميم بسيط وأنيق',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    isPremium: false,
  },
  {
    id: 'creative',
    name: 'إبداعي',
    description: 'للمبدعين والفنانين',
    primaryColor: '#6B46C1',
    secondaryColor: '#F687B3',
    isPremium: true,
  },
];

export function CardDesigner() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [primaryColor, setPrimaryColor] = useState('#01411C');
  const [secondaryColor, setSecondaryColor] = useState('#D4AF37');
  const [previewData] = useState({
    fullName: 'أحمد محمد',
    jobTitle: 'وسيط عقاري معتمد',
    company: 'نوفا العقارية',
    phone: '+966501234567',
    email: 'ahmed@nova.com',
    website: 'nova.com',
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    setPrimaryColor(template.primaryColor);
    setSecondaryColor(template.secondaryColor);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Designer Panel */}
      <div className="space-y-6">
        {/* Templates */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#01411C]" />
            اختر القالب
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`relative p-4 rounded-lg border-2 text-right transition-all ${
                  selectedTemplate === template.id
                    ? 'border-[#01411C] bg-[#01411C]/5'
                    : 'border-muted hover:border-[#01411C]/50'
                }`}
              >
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#01411C] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {template.isPremium && (
                  <Badge className="absolute top-2 right-2 bg-[#D4AF37] text-xs">
                    مميز
                  </Badge>
                )}
                <div 
                  className="w-full h-12 rounded-md mb-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)` 
                  }}
                />
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Colors */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">تخصيص الألوان</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">اللون الرئيسي</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">اللون الثانوي</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Presets */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">ألوان سريعة</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { primary: '#01411C', secondary: '#D4AF37' },
              { primary: '#1a1a1a', secondary: '#ffffff' },
              { primary: '#0066cc', secondary: '#ffcc00' },
              { primary: '#8B5CF6', secondary: '#F97316' },
              { primary: '#DC2626', secondary: '#FCD34D' },
              { primary: '#059669', secondary: '#A78BFA' },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrimaryColor(preset.primary);
                  setSecondaryColor(preset.secondary);
                }}
                className="w-10 h-10 rounded-lg border-2 border-muted hover:border-[#01411C] transition-all overflow-hidden"
              >
                <div 
                  className="w-full h-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)` 
                  }}
                />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="sticky top-6">
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/50 border-b">
            <h3 className="font-semibold">معاينة البطاقة</h3>
          </div>
          
          {/* Card Preview */}
          <div 
            className="p-6"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)` 
            }}
          >
            <div className="bg-background rounded-xl shadow-lg overflow-hidden max-w-sm mx-auto">
              {/* Header */}
              <div 
                className="h-24 relative"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                }}
              >
                <div className="absolute inset-0 bg-black/10" />
                {/* Avatar */}
                <div className="absolute -bottom-8 right-4">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {previewData.fullName.charAt(0)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-12 p-6">
                <h3 className="font-bold text-lg">{previewData.fullName}</h3>
                <p className="text-sm" style={{ color: primaryColor }}>{previewData.jobTitle}</p>
                <p className="text-xs text-muted-foreground">{previewData.company}</p>

                {/* Contact Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button 
                    size="sm" 
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="h-4 w-4 ml-1" />
                    اتصل
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 ml-1" />
                    واتساب
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 ml-1" />
                    بريد
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    <Globe className="h-4 w-4 ml-1" />
                    الموقع
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 ml-1" />
                    مشاركة
                  </Button>
                </div>
              </div>
            </div>

            {/* Powered By */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Powered by وساطه AI
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
