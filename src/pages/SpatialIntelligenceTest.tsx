/**
 * SpatialIntelligenceTest.tsx
 * صفحة اختبار الذكاء المكاني - وساطه AI
 */

import React, { useState } from 'react';
import { ArrowRight, MapPin, Sparkles, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SpatialIntelligenceReport } from '@/components/SpatialIntelligenceReport';
import { analyzeSpatialIntelligence, type SpatialAnalysisOutput } from '@/utils/spatialIntelligence';

interface PresetLocation {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  description: string;
}

// مواقع مسبقة للاختبار
const presetLocations: PresetLocation[] = [
  // الرياض
  { id: 'riyadh_olaya', name: 'حي العليا', city: 'الرياض', lat: 24.7136, lng: 46.6753, description: 'منطقة تجارية راقية' },
  { id: 'riyadh_malaz', name: 'حي الملز', city: 'الرياض', lat: 24.6720, lng: 46.7100, description: 'منطقة سكنية قديمة' },
  { id: 'riyadh_nakheel', name: 'حي النخيل', city: 'الرياض', lat: 24.7800, lng: 46.6200, description: 'منطقة سكنية حديثة' },
  { id: 'riyadh_wadi', name: 'وادي حنيفة', city: 'الرياض', lat: 24.6300, lng: 46.6300, description: 'منطقة خطر سيول' },
  
  // جدة
  { id: 'jeddah_corniche', name: 'الكورنيش', city: 'جدة', lat: 21.5433, lng: 39.1568, description: 'واجهة بحرية' },
  { id: 'jeddah_south', name: 'جنوب جدة', city: 'جدة', lat: 21.4200, lng: 39.1200, description: 'منطقة خطر سيول مرتفع' },
  
  // الدمام
  { id: 'dammam_center', name: 'وسط الدمام', city: 'الدمام', lat: 26.4207, lng: 50.1033, description: 'منطقة تجارية' },
  
  // الخبر
  { id: 'khobar_center', name: 'وسط الخبر', city: 'الخبر', lat: 26.2172, lng: 50.2083, description: 'منطقة سكنية تجارية' },
];

interface SpatialIntelligenceTestProps {
  onBack?: () => void;
}

export default function SpatialIntelligenceTest({ onBack }: SpatialIntelligenceTestProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<SpatialAnalysisOutput | null>(null);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');

  // تشغيل التحليل
  const runAnalysis = async () => {
    let lat: number, lng: number;

    if (inputMode === 'preset') {
      const location = presetLocations.find(l => l.id === selectedPreset);
      if (!location) return;
      lat = location.lat;
      lng = location.lng;
    } else {
      lat = parseFloat(customLat);
      lng = parseFloat(customLng);
      if (isNaN(lat) || isNaN(lng)) return;
    }

    setIsAnalyzing(true);
    setReport(null);

    try {
      const result = await analyzeSpatialIntelligence({
        lng,
        lat,
      });
      setReport(result);
    } catch (error) {
      console.error('خطأ في التحليل:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // اختيار موقع مسبق
  const handlePresetSelect = (value: string) => {
    setSelectedPreset(value);
    const location = presetLocations.find(l => l.id === value);
    if (location) {
      setCustomLat(location.lat.toString());
      setCustomLng(location.lng.toString());
    }
  };

  // إعادة تعيين
  const resetForm = () => {
    setSelectedPreset('');
    setCustomLat('');
    setCustomLng('');
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-white/20"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <h1 className="text-2xl font-bold">اختبار الذكاء المكاني</h1>
                <p className="text-sm text-white/80">وساطه AI - تحليل المواقع العقارية</p>
              </div>
            </div>
          </div>
          <Badge className="bg-[#D4AF37] text-[#01411C] text-sm px-3 py-1">
            🧪 وضع الاختبار
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: اختيار الموقع */}
          <Card className="border-2 border-[#D4AF37]/30 shadow-lg">
            <CardHeader className="bg-gradient-to-l from-[#fffef7] to-white">
              <CardTitle className="flex items-center gap-2 text-[#01411C]">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                اختيار الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* اختيار الوضع */}
              <div className="flex gap-2">
                <Button
                  variant={inputMode === 'preset' ? 'default' : 'outline'}
                  onClick={() => setInputMode('preset')}
                  className={inputMode === 'preset' ? 'bg-[#01411C] hover:bg-[#065f41]' : ''}
                >
                  موقع مسبق
                </Button>
                <Button
                  variant={inputMode === 'custom' ? 'default' : 'outline'}
                  onClick={() => setInputMode('custom')}
                  className={inputMode === 'custom' ? 'bg-[#01411C] hover:bg-[#065f41]' : ''}
                >
                  إحداثيات مخصصة
                </Button>
              </div>

              {inputMode === 'preset' ? (
                /* اختيار موقع مسبق */
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">اختر موقعاً للاختبار</Label>
                    <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="اختر موقعاً..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* الرياض */}
                        <div className="px-2 py-1 text-xs font-bold text-gray-500 bg-gray-100">الرياض</div>
                        {presetLocations.filter(l => l.city === 'الرياض').map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <span>{location.name}</span>
                              <span className="text-xs text-gray-400">- {location.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                        
                        {/* جدة */}
                        <div className="px-2 py-1 text-xs font-bold text-gray-500 bg-gray-100">جدة</div>
                        {presetLocations.filter(l => l.city === 'جدة').map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <span>{location.name}</span>
                              <span className="text-xs text-gray-400">- {location.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                        
                        {/* الدمام والخبر */}
                        <div className="px-2 py-1 text-xs font-bold text-gray-500 bg-gray-100">المنطقة الشرقية</div>
                        {presetLocations.filter(l => l.city === 'الدمام' || l.city === 'الخبر').map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <span>{location.name} ({location.city})</span>
                              <span className="text-xs text-gray-400">- {location.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPreset && (
                    <div className="bg-[#fffef7] border border-[#D4AF37]/30 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        <strong>الإحداثيات:</strong> {customLat}, {customLng}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* إدخال إحداثيات مخصصة */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">خط العرض (Latitude)</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="24.7136"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        className="mt-2"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">خط الطول (Longitude)</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="46.6753"
                        value={customLng}
                        onChange={(e) => setCustomLng(e.target.value)}
                        className="mt-2"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 يمكنك الحصول على الإحداثيات من خرائط Google بالضغط يميناً على أي موقع
                  </p>
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || (inputMode === 'preset' ? !selectedPreset : (!customLat || !customLng))}
                  className="flex-1 bg-[#01411C] hover:bg-[#065f41] text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      جارٍ التحليل...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-2" />
                      تشغيل التحليل
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Panel 2: نتيجة التحليل */}
          <div>
            {report ? (
              <SpatialIntelligenceReport
                report={report}
                onClose={() => setReport(null)}
              />
            ) : (
              <Card className="border-2 border-dashed border-gray-300 h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center p-8">
                  <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    لم يتم التحليل بعد
                  </h3>
                  <p className="text-sm text-gray-400">
                    اختر موقعاً وانقر "تشغيل التحليل" لعرض التقرير الكامل
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* معلومات إضافية */}
        <Card className="mt-6 border border-gray-200">
          <CardContent className="p-4">
            <h4 className="font-bold text-gray-700 mb-3">ℹ️ عن الذكاء المكاني</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <strong className="text-[#01411C]">📍 تحليل القرب:</strong>
                <p>يحسب المسافة من أقرب مدرسة، مستشفى، مسجد، محطة وقود، مول، وحديقة</p>
              </div>
              <div>
                <strong className="text-[#01411C]">🏗️ السياق العمراني:</strong>
                <p>يحلل الكثافة العمرانية وشكل المباني في المنطقة</p>
              </div>
              <div>
                <strong className="text-[#01411C]">⚠️ تقييم المخاطر:</strong>
                <p>يتحقق إذا كان الموقع في منطقة معرضة للسيول</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-4 text-center text-sm text-gray-500">
        وساطه AI - نظام الذكاء المكاني © 2025
      </footer>
    </div>
  );
}
