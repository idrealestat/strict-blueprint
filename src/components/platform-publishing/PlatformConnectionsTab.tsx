/**
 * PlatformConnectionsTab.tsx
 * تبويب ربط المنصات الخارجية
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Link,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Settings,
  Shield,
  Zap,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalPlatform, AVAILABLE_PLATFORMS } from './types';

interface PlatformConnectionsTabProps {
  platforms: ExternalPlatform[];
  onPlatformConnect: (platformId: string, credentials?: any) => Promise<boolean>;
  onPlatformDisconnect: (platformId: string) => Promise<boolean>;
}

export default function PlatformConnectionsTab({
  platforms,
  onPlatformConnect,
  onPlatformDisconnect,
}: PlatformConnectionsTabProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showCredentialsForm, setShowCredentialsForm] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '', apiKey: '' });

  const handleConnect = async (platform: ExternalPlatform) => {
    if (platform.requiresAuth) {
      setShowCredentialsForm(platform.id);
      return;
    }

    setConnectingPlatform(platform.id);
    try {
      const success = await onPlatformConnect(platform.id);
      if (success) {
        toast.success(`تم الربط مع ${platform.nameAr} بنجاح`);
      } else {
        toast.error(`فشل الربط مع ${platform.nameAr}`);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الربط');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleSubmitCredentials = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      const success = await onPlatformConnect(platformId, credentials);
      if (success) {
        toast.success('تم الربط بنجاح');
        setShowCredentialsForm(null);
        setCredentials({ username: '', password: '', apiKey: '' });
      } else {
        toast.error('فشل الربط - تحقق من البيانات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الربط');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: ExternalPlatform) => {
    try {
      const success = await onPlatformDisconnect(platform.id);
      if (success) {
        toast.success(`تم إلغاء الربط مع ${platform.nameAr}`);
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const getStatusBadge = (status: ExternalPlatform['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            متصل
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            جاري التحقق
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
            <X className="w-3 h-3 mr-1" />
            غير متصل
          </Badge>
        );
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">ربط المنصات</h2>
            <p className="text-sm text-muted-foreground">اربط حسابك مع المنصات العقارية</p>
          </div>
          <Badge variant="outline" className="border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
            {platforms.filter(p => p.status === 'connected').length} / {platforms.length} مربوط
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">نشر آلي متعدد المنصات</h3>
                <p className="text-sm text-blue-700">
                  اربط حساباتك على المنصات العقارية لنشر إعلاناتك تلقائياً على جميع المنصات بضغطة واحدة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platforms Grid */}
        <div className="grid gap-3">
          {platforms.map((platform) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`border-2 transition-all duration-300 ${
                  platform.status === 'connected' 
                    ? 'border-green-200 bg-green-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Platform Info */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: platform.bgColor }}
                      >
                        {platform.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[hsl(var(--foreground))]">{platform.nameAr}</h3>
                          {getStatusBadge(platform.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{platform.name}</p>
                        <div className="flex gap-1 mt-1">
                          {platform.features.slice(0, 2).map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {platform.status === 'connected' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600"
                            onClick={() => handleDisconnect(platform)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/90 text-white"
                          onClick={() => handleConnect(platform)}
                          disabled={connectingPlatform === platform.id}
                        >
                          {connectingPlatform === platform.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link className="w-4 h-4 ml-1" />
                              ربط
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Credentials Form */}
                  <AnimatePresence>
                    {showCredentialsForm === platform.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">اسم المستخدم / البريد</Label>
                              <Input
                                placeholder="أدخل اسم المستخدم"
                                value={credentials.username}
                                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label className="text-sm">كلمة المرور</Label>
                              <Input
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                value={credentials.password}
                                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">مفتاح API (اختياري)</Label>
                            <Input
                              placeholder="أدخل مفتاح API إن وجد"
                              value={credentials.apiKey}
                              onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowCredentialsForm(null);
                                setCredentials({ username: '', password: '', apiKey: '' });
                              }}
                            >
                              إلغاء
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/90"
                              onClick={() => handleSubmitCredentials(platform.id)}
                              disabled={connectingPlatform === platform.id}
                            >
                              {connectingPlatform === platform.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 ml-1" />
                                  تأكيد الربط
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Shield className="w-4 h-4" />
              <span>بيانات حساباتك مشفرة ومحمية بالكامل</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
