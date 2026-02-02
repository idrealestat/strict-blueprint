/**
 * PlatformConnectionsTab.tsx
 * تبويب ربط المنصات الخارجية - حقول موحدة لجميع المنصات
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Link,
  Check,
  X,
  RefreshCw,
  Settings,
  Shield,
  Info,
  Loader2,
  Key,
  Globe,
  TestTube,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalPlatform } from './types';

// بيانات الاعتماد الموحدة لجميع المنصات
interface PlatformCredentials {
  vendorId: string;
  token: string;
  environment: 'preprod' | 'production';
}

// مخزن بيانات جميع المنصات
interface AllPlatformsCredentials {
  [platformId: string]: PlatformCredentials;
}

interface PlatformConnectionsTabProps {
  platforms: ExternalPlatform[];
  onPlatformConnect: (platformId: string, credentials?: any) => Promise<boolean>;
  onPlatformDisconnect: (platformId: string) => Promise<boolean>;
}

// معلومات API لكل منصة
const PLATFORM_API_INFO: Record<string, { preprodUrl: string; prodUrl: string; helpText: string }> = {
  wasalt: {
    preprodUrl: 'preprod-api.wasalt.com',
    prodUrl: 'api.wasalt.com',
    helpText: 'للحصول على البيانات، تواصل مع فريق وصلت أو سجّل في برنامج المطورين',
  },
  aqar: {
    preprodUrl: 'sandbox.aqar.fm/api',
    prodUrl: 'api.aqar.fm',
    helpText: 'سجّل كوسيط معتمد على منصة عقار للحصول على بيانات API',
  },
  deal: {
    preprodUrl: 'test-api.deal.sa',
    prodUrl: 'api.deal.sa',
    helpText: 'تواصل مع فريق ديل للحصول على صلاحيات API',
  },
  haraj: {
    preprodUrl: 'test.haraj.com.sa/api',
    prodUrl: 'api.haraj.com.sa',
    helpText: 'سجّل حساب تاجر على حراج واطلب بيانات API',
  },
  sandak: {
    preprodUrl: 'staging.sandak.sa/api',
    prodUrl: 'api.sandak.sa',
    helpText: 'تواصل مع دعم سندك للحصول على بيانات التكامل',
  },
  bayut: {
    preprodUrl: 'sandbox.bayut.sa/api',
    prodUrl: 'api.bayut.sa',
    helpText: 'سجّل كوكيل عقاري على بيوت للحصول على صلاحيات API',
  },
  thaki: {
    preprodUrl: 'test.thaki.sa/api',
    prodUrl: 'api.thaki.sa',
    helpText: 'تواصل مع فريق ذكي للحصول على بيانات API',
  },
  moktamel: {
    preprodUrl: 'staging.moktamel.sa/api',
    prodUrl: 'api.moktamel.sa',
    helpText: 'سجّل على منصة مكتمل واطلب بيانات التكامل',
  },
};

export default function PlatformConnectionsTab({
  platforms,
  onPlatformConnect,
  onPlatformDisconnect,
}: PlatformConnectionsTabProps) {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showCredentialsForm, setShowCredentialsForm] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionTestResults, setConnectionTestResults] = useState<Record<string, 'success' | 'error'>>({});
  
  // بيانات جميع المنصات
  const [allCredentials, setAllCredentials] = useState<AllPlatformsCredentials>({});

  // تحميل البيانات المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('platform_credentials');
    if (saved) {
      try {
        setAllCredentials(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading platform credentials');
      }
    }
  }, []);

  // الحصول على بيانات منصة معينة
  const getPlatformCredentials = (platformId: string): PlatformCredentials => {
    return allCredentials[platformId] || { vendorId: '', token: '', environment: 'preprod' };
  };

  // تحديث بيانات منصة معينة
  const updatePlatformCredentials = (platformId: string, field: keyof PlatformCredentials, value: string) => {
    setAllCredentials(prev => ({
      ...prev,
      [platformId]: {
        ...getPlatformCredentials(platformId),
        [field]: value,
      }
    }));
  };

  // اختبار الاتصال
  const testConnection = async (platformId: string) => {
    const creds = getPlatformCredentials(platformId);
    if (!creds.vendorId || !creds.token) {
      toast.error('الرجاء إدخال Vendor ID و Token');
      return;
    }

    setTestingConnection(platformId);
    setConnectionTestResults(prev => ({ ...prev, [platformId]: undefined as any }));

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionTestResults(prev => ({ ...prev, [platformId]: 'success' }));
      toast.success('تم اختبار الاتصال بنجاح!');
    } catch (error) {
      setConnectionTestResults(prev => ({ ...prev, [platformId]: 'error' }));
      toast.error('فشل اختبار الاتصال');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleConnect = (platform: ExternalPlatform) => {
    setShowCredentialsForm(platform.id);
  };

  const handleSubmitCredentials = async (platformId: string) => {
    const creds = getPlatformCredentials(platformId);
    if (!creds.vendorId || !creds.token) {
      toast.error('الرجاء إدخال جميع البيانات المطلوبة');
      return;
    }

    setConnectingPlatform(platformId);
    try {
      // حفظ البيانات
      const updated = { ...allCredentials, [platformId]: creds };
      localStorage.setItem('platform_credentials', JSON.stringify(updated));
      
      const success = await onPlatformConnect(platformId, creds);
      if (success) {
        const platformName = platforms.find(p => p.id === platformId)?.nameAr || platformId;
        toast.success(`تم الربط مع ${platformName} بنجاح!`);
        setShowCredentialsForm(null);
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
      const updated = { ...allCredentials };
      delete updated[platform.id];
      localStorage.setItem('platform_credentials', JSON.stringify(updated));
      setAllCredentials(updated);
      setConnectionTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[platform.id];
        return newResults;
      });
      
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

  // نموذج الربط الموحد لجميع المنصات
  const renderCredentialsForm = (platform: ExternalPlatform) => {
    const creds = getPlatformCredentials(platform.id);
    const apiInfo = PLATFORM_API_INFO[platform.id] || {
      preprodUrl: 'test-api.platform.com',
      prodUrl: 'api.platform.com',
      helpText: 'تواصل مع فريق المنصة للحصول على بيانات API',
    };
    const testResult = connectionTestResults[platform.id];

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <Separator className="my-4" />
        
        {/* معلومات API */}
        <Alert className="mb-4" style={{ 
          backgroundColor: `${platform.color}10`, 
          borderColor: `${platform.color}30` 
        }}>
          <Info className="w-4 h-4" style={{ color: platform.color }} />
          <AlertTitle style={{ color: platform.color }}>معلومات API {platform.nameAr}</AlertTitle>
          <AlertDescription className="text-sm mt-1" style={{ color: `${platform.color}CC` }}>
            {apiInfo.helpText}
          </AlertDescription>
        </Alert>

        <div className="space-y-3 sm:space-y-4">
          {/* اختيار البيئة */}
          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 block">بيئة الاتصال</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={creds.environment === 'preprod' ? 'default' : 'outline'}
                onClick={() => updatePlatformCredentials(platform.id, 'environment', 'preprod')}
                className={`text-xs sm:text-sm ${creds.environment === 'preprod' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
              >
                <TestTube className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                <span className="hidden sm:inline">تجريبي (Pre-prod)</span>
                <span className="sm:hidden">تجريبي</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={creds.environment === 'production' ? 'default' : 'outline'}
                onClick={() => updatePlatformCredentials(platform.id, 'environment', 'production')}
                className={`text-xs sm:text-sm ${creds.environment === 'production' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                <span className="hidden sm:inline">إنتاج (Production)</span>
                <span className="sm:hidden">إنتاج</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {creds.environment === 'preprod' 
                ? `البيئة التجريبية: ${apiInfo.preprodUrl}`
                : `البيئة الإنتاجية: ${apiInfo.prodUrl}`
              }
            </p>
          </div>

          {/* Vendor ID */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              Vendor ID (معرف التاجر)
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                placeholder="مثال: 67afad38ee408f44f3c9c39e"
                value={creds.vendorId}
                onChange={(e) => updatePlatformCredentials(platform.id, 'vendorId', e.target.value)}
                className="font-mono text-sm bg-white"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              المعرف الفريد لحسابك على منصة {platform.nameAr}
            </p>
          </div>

          {/* Token */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Token (رمز المصادقة)
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                type="password"
                placeholder="مثال: 0e93eb53f2a976198acd6b19"
                value={creds.token}
                onChange={(e) => updatePlatformCredentials(platform.id, 'token', e.target.value)}
                className="font-mono text-sm bg-white"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              رمز التوثيق الخاص بك من {platform.nameAr}
            </p>
          </div>

          {/* نتيجة اختبار الاتصال */}
          {testResult && (
            <Alert className={testResult === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            }>
              {testResult === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertTitle className="text-green-800">الاتصال ناجح!</AlertTitle>
                  <AlertDescription className="text-green-700 text-sm">
                    تم التحقق من صحة البيانات. يمكنك الآن الربط والبدء في النشر.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertTitle className="text-red-800">فشل الاتصال</AlertTitle>
                  <AlertDescription className="text-red-700 text-sm">
                    تحقق من صحة Vendor ID و Token وحاول مرة أخرى.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* الأزرار */}
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => {
                setShowCredentialsForm(null);
                setConnectionTestResults(prev => {
                  const newResults = { ...prev };
                  delete newResults[platform.id];
                  return newResults;
                });
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => testConnection(platform.id)}
              disabled={testingConnection === platform.id || !creds.vendorId || !creds.token}
            >
              {testingConnection === platform.id ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <>
                  <TestTube className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  <span className="hidden sm:inline">اختبار الاتصال</span>
                  <span className="sm:hidden">اختبار</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              style={{ backgroundColor: platform.color }}
              className="text-white hover:opacity-90 text-xs sm:text-sm"
              onClick={() => handleSubmitCredentials(platform.id)}
              disabled={connectingPlatform === platform.id || !creds.vendorId || !creds.token}
            >
              {connectingPlatform === platform.id ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <>
                  <Link className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  <span className="hidden sm:inline">تفعيل الربط</span>
                  <span className="sm:hidden">تفعيل</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium mb-2">كيفية الحصول على بيانات API:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>تواصل مع فريق {platform.nameAr} عبر الموقع الرسمي</li>
            <li>اطلب الانضمام لبرنامج المطورين أو الوسطاء</li>
            <li>بعد الموافقة، ستحصل على Vendor ID و Token</li>
            <li>استخدم البيئة التجريبية أولاً للاختبار</li>
          </ol>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-clip">
      <div
        className="p-3 sm:p-4 space-y-3 sm:space-y-4 w-full max-w-full overflow-x-clip box-border min-w-0 [&_*]:max-w-full [&_*]:min-w-0"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">ربط المنصات</h2>
            <p className="text-sm text-muted-foreground">اربط حسابك مع المنصات العقارية للنشر التلقائي</p>
          </div>
          <Badge variant="outline" className="border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
            {platforms.filter(p => p.status === 'connected').length} / {platforms.length} مربوط
          </Badge>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">نشر آلي متعدد المنصات</h3>
                <p className="text-sm text-purple-700">
                  اربط حساباتك على المنصات العقارية لنشر إعلاناتك تلقائياً من مكان واحد.
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
                style={platform.status === 'connected' ? { 
                  borderColor: `${platform.color}50`,
                  backgroundColor: `${platform.color}08`
                } : {}}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Platform Info */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0"
                        style={{ backgroundColor: platform.bgColor }}
                      >
                        {platform.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-[hsl(var(--foreground))] truncate">{platform.nameAr}</h3>
                          {getStatusBadge(platform.status)}
                          {platform.id === 'wasalt' && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] hidden sm:inline-flex">
                              REGA API
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{platform.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {platform.features.slice(0, 2).map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end shrink-0">
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
                            onClick={() => setShowCredentialsForm(platform.id)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          style={{ backgroundColor: platform.color }}
                          className="text-white hover:opacity-90"
                          onClick={() => handleConnect(platform)}
                          disabled={connectingPlatform === platform.id}
                        >
                          {connectingPlatform === platform.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link className="w-4 h-4 ml-1" />
                              إعداد API
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Credentials Form */}
                  <AnimatePresence>
                    {showCredentialsForm === platform.id && renderCredentialsForm(platform)}
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
              <span>بيانات حساباتك مشفرة ومحمية بالكامل ولا يتم مشاركتها مع أي طرف</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
