/**
 * FacebookAdsPanel.tsx
 * لوحة إدارة الحملات الإعلانية على Facebook و Instagram
 * للاستخدام في تبويب "الحملات"
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { toast } from 'sonner';
import { 
  Megaphone, Facebook, Instagram, DollarSign, Eye, 
  TrendingUp, Users, Clock, Play, Pause, BarChart3,
  Target, Image, Video, Link2, AlertCircle, ExternalLink
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FacebookAdsPanel() {
  const { isAuthenticated, pages, startAuth, isLoading } = useFacebookAuth();
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  // Mock campaign data
  const mockCampaigns = [
    {
      id: '1',
      name: 'حملة ترويج شقق الرياض',
      status: 'active',
      platform: 'facebook',
      budget: 500,
      spent: 234,
      impressions: 15420,
      clicks: 342,
      conversions: 12,
    },
    {
      id: '2', 
      name: 'حملة فلل جدة',
      status: 'paused',
      platform: 'instagram',
      budget: 1000,
      spent: 450,
      impressions: 28500,
      clicks: 890,
      conversions: 28,
    }
  ];

  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-dashed border-blue-300">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2">ربط حساب الإعلانات</h3>
          <p className="text-sm text-muted-foreground mb-4">
            سجل الدخول بحساب Facebook لإدارة حملاتك الإعلانية على Facebook و Instagram
          </p>
          <Button
            onClick={startAuth}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Clock className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Facebook className="w-4 h-4 ml-2" />
            )}
            ربط حساب Meta Ads
          </Button>
          
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-right">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Wasata AI يساعدك في إدارة الحملات. الدفع والميزانية تتم مباشرة من حسابك في Meta Ads Manager.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">684 ر.س</div>
            <div className="text-xs text-blue-600">إجمالي الإنفاق</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">40</div>
            <div className="text-xs text-green-600">التحويلات</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Accordion */}
      <Accordion type="single" collapsible className="space-y-2">
        {/* Active Campaigns */}
        <AccordionItem value="active" className="border rounded-xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-right">
                <h3 className="font-bold">الحملات النشطة</h3>
                <p className="text-xs text-muted-foreground">1 حملة</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {mockCampaigns.filter(c => c.status === 'active').map(campaign => (
              <Card key={campaign.id} className="mb-3 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {campaign.platform === 'facebook' ? (
                        <Facebook className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Instagram className="w-5 h-5 text-pink-600" />
                      )}
                      <h4 className="font-bold">{campaign.name}</h4>
                    </div>
                    <Badge className="bg-green-500">نشطة</Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold">{campaign.spent} ر.س</div>
                      <div className="text-xs text-muted-foreground">الإنفاق</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.impressions.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">المشاهدات</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.clicks}</div>
                      <div className="text-xs text-muted-foreground">النقرات</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.conversions}</div>
                      <div className="text-xs text-muted-foreground">التحويلات</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Pause className="w-4 h-4 ml-1" />
                      إيقاف
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="w-4 h-4 ml-1" />
                      التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Paused Campaigns */}
        <AccordionItem value="paused" className="border rounded-xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Pause className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-right">
                <h3 className="font-bold">الحملات المتوقفة</h3>
                <p className="text-xs text-muted-foreground">1 حملة</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {mockCampaigns.filter(c => c.status === 'paused').map(campaign => (
              <Card key={campaign.id} className="mb-3 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {campaign.platform === 'facebook' ? (
                        <Facebook className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Instagram className="w-5 h-5 text-pink-600" />
                      )}
                      <h4 className="font-bold">{campaign.name}</h4>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">متوقفة</Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold">{campaign.spent} ر.س</div>
                      <div className="text-xs text-muted-foreground">الإنفاق</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.impressions.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">المشاهدات</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.clicks}</div>
                      <div className="text-xs text-muted-foreground">النقرات</div>
                    </div>
                    <div>
                      <div className="font-bold">{campaign.conversions}</div>
                      <div className="text-xs text-muted-foreground">التحويلات</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 ml-1" />
                      استئناف
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="w-4 h-4 ml-1" />
                      التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Create New Campaign */}
        <AccordionItem value="create" className="border rounded-xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <h3 className="font-bold">إنشاء حملة جديدة</h3>
                <p className="text-xs text-muted-foreground">أطلق حملة إعلانية</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="text-sm font-medium mb-2 block">اسم الحملة</label>
                <Input placeholder="مثال: حملة ترويج شقق الرياض" />
              </div>
              
              {/* Platform Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">المنصة</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start">
                    <Facebook className="w-4 h-4 ml-2 text-blue-600" />
                    Facebook
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Instagram className="w-4 h-4 ml-2 text-pink-600" />
                    Instagram
                  </Button>
                </div>
              </div>
              
              {/* Campaign Objective */}
              <div>
                <label className="text-sm font-medium mb-2 block">هدف الحملة</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start text-xs h-auto py-2">
                    <Eye className="w-4 h-4 ml-1" />
                    زيادة المشاهدات
                  </Button>
                  <Button variant="outline" className="justify-start text-xs h-auto py-2">
                    <Target className="w-4 h-4 ml-1" />
                    زيارات الموقع
                  </Button>
                  <Button variant="outline" className="justify-start text-xs h-auto py-2">
                    <Users className="w-4 h-4 ml-1" />
                    تفاعل الجمهور
                  </Button>
                  <Button variant="outline" className="justify-start text-xs h-auto py-2">
                    <TrendingUp className="w-4 h-4 ml-1" />
                    التحويلات
                  </Button>
                </div>
              </div>
              
              {/* Note */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-amber-700">
                      <p className="font-medium mb-1">ملاحظة مهمة</p>
                      <p>سيتم فتح Meta Ads Manager لإكمال إعداد الحملة وتحديد الميزانية والدفع.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="w-4 h-4 ml-2" />
                المتابعة في Meta Ads
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
