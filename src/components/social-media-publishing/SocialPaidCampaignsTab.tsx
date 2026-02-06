/**
 * SocialPaidCampaignsTab.tsx
 * تبويب الحملات الإعلانية المدفوعة
 * Google Ads, Instagram Ads, Facebook Ads, TikTok Ads, LinkedIn Ads
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Megaphone, Link2, Unlink, Eye, DollarSign, 
  TrendingUp, AlertCircle, ExternalLink, Check, Clock, Facebook, Instagram
} from 'lucide-react';
import { PaidAdPlatform, PAID_AD_PLATFORMS } from './types';
import FacebookAdsPanel from './FacebookAdsPanel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SocialPaidCampaignsTab() {
  const [platforms, setPlatforms] = useState<PaidAdPlatform[]>(PAID_AD_PLATFORMS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string>('meta');

  // ربط حساب إعلاني
  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    // محاكاة الربط
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, status: 'connected' as const } : p
    ));
    setConnecting(null);
    toast.success('تم ربط الحساب الإعلاني بنجاح');
  };

  // فك ربط حساب
  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, status: 'disconnected' as const } : p
    ));
    toast.success('تم فك ربط الحساب');
  };

  const connectedCount = platforms.filter(p => p.status === 'connected').length;
  
  // Filter out Facebook and Instagram from other platforms (they're handled by FacebookAdsPanel)
  const otherPlatforms = platforms.filter(p => !['facebook_ads', 'instagram_ads'].includes(p.id));
 
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* العنوان */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">الحملات الإعلانية</h2>
              <p className="text-orange-100 text-sm">إدارة حملاتك المدفوعة على المنصات</p>
            </div>
          </div>
        </div>

        {/* تنبيه مهم */}
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800">ملاحظة مهمة</h4>
                <p className="text-sm text-amber-700">
                  Wasata AI يعمل كواجهة لإعداد ومراقبة الحملات فقط. 
                  جميع عمليات الدفع والميزانية تتم مباشرة من حسابك الإعلاني على كل منصة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الأكورديون للمنصات */}
        <Accordion 
          type="single" 
          collapsible
          value={openSection}
          onValueChange={setOpenSection}
          className="space-y-3"
        >
          {/* قسم Meta (Facebook & Instagram) */}
          <AccordionItem 
            value="meta" 
            className="border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">Meta Ads</h3>
                  <p className="text-xs text-muted-foreground">Facebook & Instagram Ads</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <FacebookAdsPanel />
            </AccordionContent>
          </AccordionItem>

          {/* قسم المنصات الأخرى */}
          <AccordionItem 
            value="other" 
            className="border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">منصات أخرى</h3>
                  <p className="text-xs text-muted-foreground">Google Ads, TikTok Ads, LinkedIn</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* ملخص */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{connectedCount}</div>
                    <div className="text-sm text-green-600">حسابات مرتبطة</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{otherPlatforms.length}</div>
                    <div className="text-sm text-blue-600">منصات متاحة</div>
                  </CardContent>
                </Card>
              </div>
 
              {/* قائمة المنصات الإعلانية الأخرى */}
              <div className="space-y-3">
                {otherPlatforms.map((platform) => (
                  <Card 
                    key={platform.id}
                    className={`transition-all ${
                      platform.status === 'connected' 
                        ? 'border-green-300 bg-green-50/50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${platform.color}20` }}
                          >
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{platform.name}</h4>
                            <p className="text-sm text-gray-500">{platform.nameEn}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {platform.status === 'connected' ? (
                            <>
                              <Badge className="bg-green-500">
                                <Check className="w-3 h-3 ml-1" />
                                مرتبط
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDisconnect(platform.id)}
                                className="text-destructive border-destructive/50"
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(platform.id)}
                              disabled={connecting === platform.id}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {connecting === platform.id ? (
                                <Clock className="w-4 h-4 ml-1 animate-spin" />
                              ) : (
                                <Link2 className="w-4 h-4 ml-1" />
                              )}
                              ربط الحساب
                            </Button>
                          )}
                        </div>
                      </div>
                 
                 {/* إحصائيات للحسابات المرتبطة */}
                 {platform.status === 'connected' && (
                   <div className="mt-4 pt-4 border-t border-gray-200">
                     <div className="grid grid-cols-3 gap-3 text-center">
                       <div>
                         <div className="text-lg font-bold text-gray-700">0</div>
                         <div className="text-xs text-gray-500">حملات نشطة</div>
                       </div>
                       <div>
                         <div className="text-lg font-bold text-gray-700">0 ر.س</div>
                         <div className="text-xs text-gray-500">الإنفاق</div>
                       </div>
                       <div>
                         <div className="text-lg font-bold text-gray-700">0</div>
                         <div className="text-xs text-gray-500">النقرات</div>
                       </div>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       className="w-full mt-3"
                     >
                       <Eye className="w-4 h-4 ml-2" />
                       عرض الحملات
                     </Button>
                   </div>
                 )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ملاحظة: لا يوجد نشر عضوي هنا */}
        <Card className="border-muted bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              ⚠️ هذا التبويب مخصص للحملات المدفوعة فقط. 
              للنشر العضوي، استخدم تبويب "المحتوى".
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}