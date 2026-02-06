/**
 * SocialPlatformConnectionsTab.tsx
 * تبويب ربط المنصات الاجتماعية (7 منصات)
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Link2, Unlink, Check, Clock, AlertCircle, Shield } from 'lucide-react';
import { SocialPlatform, SOCIAL_PLATFORMS } from './types';
import FacebookInstagramConnectionPanel from './FacebookInstagramConnectionPanel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SocialPlatformConnectionsTabProps {
  platforms: SocialPlatform[];
  onConnect: (platformId: string) => Promise<boolean>;
  onDisconnect: (platformId: string) => Promise<boolean>;
}

export default function SocialPlatformConnectionsTab({
  platforms,
  onConnect,
  onDisconnect,
}: SocialPlatformConnectionsTabProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string>('meta');

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      const success = await onConnect(platformId);
      if (success) {
        toast.success('تم ربط المنصة بنجاح');
      }
    } catch (error) {
      toast.error('فشل في ربط المنصة');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await onDisconnect(platformId);
      toast.success('تم فك ربط المنصة');
    } catch (error) {
      toast.error('فشل في فك ربط المنصة');
    }
  };

  const connectedCount = platforms.filter(p => p.status === 'connected').length;
  
  // Filter out Facebook and Instagram (they're handled by FacebookInstagramConnectionPanel)
  const otherPlatforms = platforms.filter(p => !['instagram', 'facebook'].includes(p.id));

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* ملخص الربط */}
        <Card className="border-2 border-accent bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-primary">المنصات المرتبطة</h3>
                <p className="text-sm text-muted-foreground">
                  {connectedCount} من {platforms.length} منصة مرتبطة
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{connectedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تنبيه الأمان */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            جميع بيانات الربط مشفرة ومحمية. لا نشارك بياناتك مع أي طرف ثالث.
          </p>
        </div>

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
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-lg">📱</span>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">Facebook & Instagram</h3>
                  <p className="text-xs text-muted-foreground">ربط تلقائي للصفحات وحسابات الأعمال</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <FacebookInstagramConnectionPanel />
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
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">منصات أخرى</h3>
                  <p className="text-xs text-muted-foreground">Twitter, LinkedIn, Snapchat...</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
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
                            className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center text-2xl`}
                          >
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">{platform.name}</h4>
                            <p className="text-sm text-muted-foreground">{platform.nameEn}</p>
                            <div className="flex gap-1 mt-1">
                              {platform.supportsOrganic && (
                                <Badge variant="outline" className="text-xs">عضوي</Badge>
                              )}
                              {platform.supportsPaid && (
                                <Badge variant="outline" className="text-xs">مدفوع</Badge>
                              )}
                              {platform.supportsMessaging && (
                                <Badge variant="outline" className="text-xs">مراسلة</Badge>
                              )}
                            </div>
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
                                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            </>
                          ) : platform.status === 'pending' ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              <Clock className="w-3 h-3 ml-1" />
                              قيد الربط
                            </Badge>
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
                              ربط
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}