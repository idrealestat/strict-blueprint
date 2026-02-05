 /**
  * AdvancedAnalyticsTab.tsx
  * تبويب التحليلات المتقدم - عرض بيانات فقط بدون تعديل
  * المنصات: Instagram, Facebook, TikTok, YouTube, Google Business, Telegram, LinkedIn
  */
 
 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Progress } from '@/components/ui/progress';
 import { Separator } from '@/components/ui/separator';
 import {
   BarChart3,
   Eye,
   Heart,
   MessageCircle,
   Share2,
   TrendingUp,
   TrendingDown,
   AlertCircle,
   Clock,
   Calendar,
   CheckCircle,
   XCircle,
   Activity,
   PieChart,
   Bell,
   Info,
 } from 'lucide-react';
 import { motion } from 'framer-motion';
 
 // المنصات المدعومة للتحليلات
 interface AnalyticsPlatform {
   id: string;
   name: string;
   nameAr: string;
   logo: string;
   color: string;
   connected: boolean;
 }
 
 const ANALYTICS_PLATFORMS: AnalyticsPlatform[] = [
   { id: 'instagram', name: 'Instagram', nameAr: 'انستجرام', logo: '📸', color: '#E1306C', connected: true },
   { id: 'facebook', name: 'Facebook', nameAr: 'فيسبوك', logo: '📘', color: '#1877F2', connected: true },
   { id: 'tiktok', name: 'TikTok', nameAr: 'تيك توك', logo: '🎵', color: '#000000', connected: true },
   { id: 'youtube', name: 'YouTube', nameAr: 'يوتيوب', logo: '📺', color: '#FF0000', connected: false },
   { id: 'google_business', name: 'Google Business', nameAr: 'جوجل أعمال', logo: '🏢', color: '#4285F4', connected: true },
   { id: 'telegram', name: 'Telegram', nameAr: 'تيليجرام', logo: '✈️', color: '#0088CC', connected: false },
   { id: 'linkedin', name: 'LinkedIn', nameAr: 'لينكد إن', logo: '💼', color: '#0A66C2', connected: false },
 ];
 
 // نوع المنشور
 interface PostAnalytics {
   id: string;
   platform: string;
   title: string;
   status: 'published' | 'failed';
   views: number | null;
   likes: number | null;
   comments: number | null;
   shares: number | null;
   publishedAt: string;
   failReason?: string;
 }
 
 // بيانات تجريبية
 const MOCK_POSTS: PostAnalytics[] = [
   { id: '1', platform: 'instagram', title: 'فيلا فاخرة في حي الملقا', status: 'published', views: 1250, likes: 89, comments: 12, shares: 5, publishedAt: '2025-02-01' },
   { id: '2', platform: 'facebook', title: 'شقة للإيجار في الرياض', status: 'published', views: 890, likes: 45, comments: 8, shares: 3, publishedAt: '2025-02-02' },
   { id: '3', platform: 'tiktok', title: 'جولة عقارية مميزة', status: 'published', views: 5600, likes: 320, comments: 45, shares: 89, publishedAt: '2025-02-03' },
   { id: '4', platform: 'instagram', title: 'أرض تجارية للبيع', status: 'failed', views: null, likes: null, comments: null, shares: null, publishedAt: '2025-02-04', failReason: 'فشل في الاتصال بالخادم' },
   { id: '5', platform: 'google_business', title: 'عرض خاص على الشقق', status: 'published', views: 340, likes: null, comments: 2, shares: null, publishedAt: '2025-02-05' },
 ];
 
 // الفترات الزمنية
 type TimePeriod = 'today' | 'week' | 'month' | 'custom';
 
 export default function AdvancedAnalyticsTab() {
   const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
   const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
   const [posts] = useState<PostAnalytics[]>(MOCK_POSTS);
 
   // إحصائيات عامة
   const overview = useMemo(() => {
     const filtered = selectedPlatform === 'all' 
       ? posts 
       : posts.filter(p => p.platform === selectedPlatform);
     
     return {
       totalPosts: filtered.length,
       connectedPlatforms: ANALYTICS_PLATFORMS.filter(p => p.connected).length,
       successfulPosts: filtered.filter(p => p.status === 'published').length,
       failedPosts: filtered.filter(p => p.status === 'failed').length,
       totalViews: filtered.reduce((sum, p) => sum + (p.views || 0), 0),
       totalLikes: filtered.reduce((sum, p) => sum + (p.likes || 0), 0),
       totalComments: filtered.reduce((sum, p) => sum + (p.comments || 0), 0),
       totalShares: filtered.reduce((sum, p) => sum + (p.shares || 0), 0),
     };
   }, [posts, selectedPlatform]);
 
   // التنبيهات
   const alerts = useMemo(() => {
     const issues: { type: 'warning' | 'error'; message: string }[] = [];
     
     // فشل نشر متكرر
     const failedCount = posts.filter(p => p.status === 'failed').length;
     if (failedCount >= 2) {
       issues.push({ type: 'error', message: `فشل نشر ${failedCount} منشورات - تحقق من الربط` });
     }
     
     // انخفاض التفاعل
     const recentPosts = posts.filter(p => p.status === 'published').slice(0, 3);
     const avgViews = recentPosts.reduce((sum, p) => sum + (p.views || 0), 0) / recentPosts.length;
     if (avgViews < 500 && recentPosts.length > 0) {
       issues.push({ type: 'warning', message: 'انخفاض ملحوظ في المشاهدات مقارنة بالمعدل' });
     }
     
     return issues;
   }, [posts]);
 
   const filteredPosts = useMemo(() => {
     if (selectedPlatform === 'all') return posts;
     return posts.filter(p => p.platform === selectedPlatform);
   }, [posts, selectedPlatform]);
 
   const getPlatformInfo = (platformId: string) => {
     return ANALYTICS_PLATFORMS.find(p => p.id === platformId);
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4" dir="rtl">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">التحليلات</h2>
             <p className="text-sm text-muted-foreground">عرض بيانات الأداء فقط</p>
           </div>
           <Badge variant="outline" className="border-indigo-500 text-indigo-600">
             <BarChart3 className="w-3 h-3 ml-1" />
             Analytics
           </Badge>
         </div>
 
         {/* تنبيه مهم */}
         <Alert className="bg-blue-50 border-blue-200">
           <Info className="w-4 h-4 text-blue-600" />
           <AlertTitle className="text-blue-800">للعرض فقط</AlertTitle>
           <AlertDescription className="text-blue-700 text-sm">
             هذا التبويب للتحليلات فقط - لا نشر، لا تعديل محتوى، لا حملات
           </AlertDescription>
         </Alert>
 
         {/* الفلاتر */}
         <div className="flex flex-wrap gap-2">
           <Select value={timePeriod} onValueChange={v => setTimePeriod(v as TimePeriod)}>
             <SelectTrigger className="w-32">
               <Clock className="w-4 h-4 ml-1" />
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="today">اليوم</SelectItem>
               <SelectItem value="week">آخر 7 أيام</SelectItem>
               <SelectItem value="month">آخر 30 يوم</SelectItem>
               <SelectItem value="custom">مخصص</SelectItem>
             </SelectContent>
           </Select>
 
           <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
             <SelectTrigger className="w-36">
               <SelectValue placeholder="كل المنصات" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">كل المنصات</SelectItem>
               {ANALYTICS_PLATFORMS.filter(p => p.connected).map(p => (
                 <SelectItem key={p.id} value={p.id}>
                   {p.logo} {p.nameAr}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* نظرة عامة */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-600" />
               نظرة عامة
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-blue-50 p-3 rounded-lg text-center">
                 <p className="text-2xl font-bold text-blue-700">{overview.totalPosts}</p>
                 <p className="text-xs text-blue-600">إجمالي المنشورات</p>
               </div>
               <div className="bg-green-50 p-3 rounded-lg text-center">
                 <p className="text-2xl font-bold text-green-700">{overview.connectedPlatforms}</p>
                 <p className="text-xs text-green-600">منصات مرتبطة</p>
               </div>
               <div className="bg-emerald-50 p-3 rounded-lg text-center">
                 <p className="text-2xl font-bold text-emerald-700">{overview.successfulPosts}</p>
                 <p className="text-xs text-emerald-600">نشر ناجح</p>
               </div>
               <div className="bg-red-50 p-3 rounded-lg text-center">
                 <p className="text-2xl font-bold text-red-700">{overview.failedPosts}</p>
                 <p className="text-xs text-red-600">نشر فاشل</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* أداء المحتوى */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-green-600" />
               أداء المحتوى
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-4 gap-2 text-center">
               <div className="p-2 bg-gray-50 rounded">
                 <Eye className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                 <p className="font-bold">{overview.totalViews.toLocaleString()}</p>
                 <p className="text-xs text-muted-foreground">مشاهدة</p>
               </div>
               <div className="p-2 bg-gray-50 rounded">
                 <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
                 <p className="font-bold">{overview.totalLikes}</p>
                 <p className="text-xs text-muted-foreground">إعجاب</p>
               </div>
               <div className="p-2 bg-gray-50 rounded">
                 <MessageCircle className="w-4 h-4 mx-auto text-green-500 mb-1" />
                 <p className="font-bold">{overview.totalComments}</p>
                 <p className="text-xs text-muted-foreground">تعليق</p>
               </div>
               <div className="p-2 bg-gray-50 rounded">
                 <Share2 className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                 <p className="font-bold">{overview.totalShares}</p>
                 <p className="text-xs text-muted-foreground">مشاركة</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* التنبيهات */}
         {alerts.length > 0 && (
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                 <Bell className="w-5 h-5 text-amber-600" />
                 التنبيهات ({alerts.length})
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-2">
               {alerts.map((alert, idx) => (
                 <Alert 
                   key={idx} 
                   className={alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}
                 >
                   <AlertCircle className={`w-4 h-4 ${alert.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                   <AlertDescription className={alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}>
                     {alert.message}
                   </AlertDescription>
                 </Alert>
               ))}
               <p className="text-xs text-muted-foreground mt-2">
                 ⚠️ عرض بيانات فقط - بدون اقتراحات تلقائية
               </p>
             </CardContent>
           </Card>
         )}
 
         {/* المنشورات حسب المنصة */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <PieChart className="w-5 h-5 text-purple-600" />
               المنشورات ({filteredPosts.length})
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             {filteredPosts.length === 0 ? (
               <div className="text-center py-6 text-muted-foreground">
                 <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                 <p>لا توجد منشورات</p>
               </div>
             ) : (
               filteredPosts.map(post => {
                 const platform = getPlatformInfo(post.platform);
                 return (
                   <motion.div
                     key={post.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className={`p-3 rounded-lg border ${
                       post.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                     }`}
                   >
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-lg">{platform?.logo}</span>
                         <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                       </div>
                       {post.status === 'published' ? (
                         <Badge className="bg-green-100 text-green-700">
                           <CheckCircle className="w-3 h-3 ml-1" />
                           Published
                         </Badge>
                       ) : (
                         <Badge className="bg-red-100 text-red-700">
                           <XCircle className="w-3 h-3 ml-1" />
                           Failed
                         </Badge>
                       )}
                     </div>
 
                     {post.status === 'published' ? (
                       <div className="grid grid-cols-4 gap-1 text-xs text-center">
                         <div>
                           <p className="font-bold">{post.views?.toLocaleString() ?? 'غير متاح'}</p>
                           <p className="text-muted-foreground">مشاهدة</p>
                         </div>
                         <div>
                           <p className="font-bold">{post.likes ?? 'غير متاح'}</p>
                           <p className="text-muted-foreground">إعجاب</p>
                         </div>
                         <div>
                           <p className="font-bold">{post.comments ?? 'غير متاح'}</p>
                           <p className="text-muted-foreground">تعليق</p>
                         </div>
                         <div>
                           <p className="font-bold">{post.shares ?? 'غير متاح'}</p>
                           <p className="text-muted-foreground">مشاركة</p>
                         </div>
                       </div>
                     ) : (
                       <p className="text-xs text-red-600">{post.failReason}</p>
                     )}
                   </motion.div>
                 );
               })
             )}
           </CardContent>
         </Card>
 
         {/* ممنوعات */}
         <Alert className="bg-red-50 border-red-200">
           <XCircle className="w-4 h-4 text-red-600" />
           <AlertTitle className="text-red-800">ممنوع داخل التحليلات</AlertTitle>
           <AlertDescription className="text-red-700 text-sm">
             <ul className="list-disc list-inside mt-1 space-y-1">
               <li>ذكاء اصطناعي يقترح محتوى</li>
               <li>تعديل منشورات</li>
               <li>تشغيل حملات</li>
               <li>تنبؤات</li>
             </ul>
           </AlertDescription>
         </Alert>
 
         {/* شروط البيانات */}
         <Card className="border-amber-200 bg-amber-50">
           <CardContent className="p-3">
             <p className="text-xs text-amber-800">
               🔒 <strong>شروط البيانات:</strong> تُعرض البيانات حسب المستخدم والحساب المرتبط فقط. 
               لا دمج بيانات مستخدمين. لا مشاركة بيانات بين الحسابات.
             </p>
           </CardContent>
         </Card>
       </div>
     </ScrollArea>
   );
 }