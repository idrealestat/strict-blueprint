 /**
  * SocialAnalyticsTab.tsx
  * تبويب التحليلات - للعرض فقط
  * 7 منصات: Instagram, Facebook, TikTok, YouTube, Google Business, Telegram, LinkedIn
  */
 
 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { 
   BarChart3, Eye, Heart, MessageCircle, Share2, 
   TrendingUp, TrendingDown, Calendar, AlertCircle,
   Check, X, Clock
 } from 'lucide-react';
 import { SocialPlatformId, SOCIAL_PLATFORMS, PostAnalytics } from './types';
 
 // بيانات تجريبية للتحليلات
 const MOCK_ANALYTICS: Record<SocialPlatformId, { posts: PostAnalytics[]; totals: any }> = {
   instagram: {
     totals: { views: 12500, likes: 890, comments: 145, shares: 67 },
     posts: [
       { id: '1', platformId: 'instagram', title: 'فيلا فاخرة للبيع', publishedAt: '2024-01-15', views: 5200, likes: 320, comments: 45, shares: 23, status: 'published' },
       { id: '2', platformId: 'instagram', title: 'شقة مميزة بالرياض', publishedAt: '2024-01-14', views: 3800, likes: 280, comments: 38, shares: 18, status: 'published' },
     ]
   },
   facebook: {
     totals: { views: 8900, likes: 560, comments: 89, shares: 45 },
     posts: [
       { id: '3', platformId: 'facebook', title: 'أرض تجارية', publishedAt: '2024-01-15', views: 4500, likes: 280, comments: 42, shares: 25, status: 'published' },
     ]
   },
   tiktok: {
     totals: { views: 25000, likes: 1890, comments: 234, shares: 156 },
     posts: [
       { id: '4', platformId: 'tiktok', title: 'جولة في الفيلا', publishedAt: '2024-01-15', views: 15000, likes: 1200, comments: 156, shares: 89, status: 'published' },
     ]
   },
   youtube: {
     totals: { views: 3200, likes: 180, comments: 34, shares: 12 },
     posts: []
   },
   google_business: {
     totals: { views: 1500, likes: 0, comments: 0, shares: 0 },
     posts: []
   },
   telegram: {
     totals: { views: 890, likes: 0, comments: 12, shares: 45 },
     posts: []
   },
   linkedin: {
     totals: { views: 2100, likes: 89, comments: 23, shares: 34 },
     posts: []
   }
 };
 
 export default function SocialAnalyticsTab() {
   const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'custom'>('7days');
   const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformId | 'all'>('all');
 
   // حساب الإجماليات
   const calculateTotals = () => {
     if (selectedPlatform === 'all') {
       return Object.values(MOCK_ANALYTICS).reduce(
         (acc, { totals }) => ({
           views: acc.views + totals.views,
           likes: acc.likes + totals.likes,
           comments: acc.comments + totals.comments,
           shares: acc.shares + totals.shares,
         }),
         { views: 0, likes: 0, comments: 0, shares: 0 }
       );
     }
     return MOCK_ANALYTICS[selectedPlatform]?.totals || { views: 0, likes: 0, comments: 0, shares: 0 };
   };
 
   const totals = calculateTotals();
 
   // جمع كل المنشورات
   const getAllPosts = () => {
     if (selectedPlatform === 'all') {
       return Object.values(MOCK_ANALYTICS).flatMap(({ posts }) => posts);
     }
     return MOCK_ANALYTICS[selectedPlatform]?.posts || [];
   };
 
   const posts = getAllPosts();
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4">
         {/* العنوان */}
         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
           <div className="flex items-center gap-3">
             <BarChart3 className="w-8 h-8" />
             <div>
               <h2 className="text-xl font-bold">التحليلات</h2>
               <p className="text-indigo-100 text-sm">أداء المحتوى على التواصل الاجتماعي</p>
             </div>
           </div>
         </div>
 
         {/* تنبيه: للعرض فقط */}
         <Card className="border-blue-200 bg-blue-50">
           <CardContent className="p-3">
             <p className="text-sm text-blue-700 flex items-center gap-2">
               <Eye className="w-4 h-4" />
               هذا التبويب للعرض والتحليل فقط - لا نشر أو تعديل
             </p>
           </CardContent>
         </Card>
 
         {/* فلترة الوقت */}
         <div className="flex gap-2 overflow-x-auto pb-2">
           <Button
             size="sm"
             variant={timeFilter === '7days' ? 'default' : 'outline'}
             onClick={() => setTimeFilter('7days')}
             className={timeFilter === '7days' ? 'bg-[#01411C]' : ''}
           >
             آخر 7 أيام
           </Button>
           <Button
             size="sm"
             variant={timeFilter === '30days' ? 'default' : 'outline'}
             onClick={() => setTimeFilter('30days')}
             className={timeFilter === '30days' ? 'bg-[#01411C]' : ''}
           >
             آخر 30 يوم
           </Button>
           <Button
             size="sm"
             variant={timeFilter === 'custom' ? 'default' : 'outline'}
             onClick={() => setTimeFilter('custom')}
             className={timeFilter === 'custom' ? 'bg-[#01411C]' : ''}
           >
             <Calendar className="w-4 h-4 ml-1" />
             مخصص
           </Button>
         </div>
 
         {/* ملخص عام */}
         <div className="grid grid-cols-2 gap-3">
           <Card className="border-2 border-blue-200">
             <CardContent className="p-4 text-center">
               <Eye className="w-6 h-6 text-blue-600 mx-auto mb-1" />
               <div className="text-2xl font-bold text-blue-700">
                 {totals.views.toLocaleString()}
               </div>
               <div className="text-sm text-gray-500">المشاهدات</div>
             </CardContent>
           </Card>
           <Card className="border-2 border-red-200">
             <CardContent className="p-4 text-center">
               <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
               <div className="text-2xl font-bold text-red-600">
                 {totals.likes.toLocaleString()}
               </div>
               <div className="text-sm text-gray-500">الإعجابات</div>
             </CardContent>
           </Card>
           <Card className="border-2 border-green-200">
             <CardContent className="p-4 text-center">
               <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
               <div className="text-2xl font-bold text-green-700">
                 {totals.comments.toLocaleString()}
               </div>
               <div className="text-sm text-gray-500">التعليقات</div>
             </CardContent>
           </Card>
           <Card className="border-2 border-purple-200">
             <CardContent className="p-4 text-center">
               <Share2 className="w-6 h-6 text-purple-600 mx-auto mb-1" />
               <div className="text-2xl font-bold text-purple-700">
                 {totals.shares.toLocaleString()}
               </div>
               <div className="text-sm text-gray-500">المشاركات</div>
             </CardContent>
           </Card>
         </div>
 
         {/* فلترة المنصات */}
         <div>
           <h3 className="font-bold text-gray-800 mb-2">فلترة حسب المنصة</h3>
           <div className="flex gap-2 overflow-x-auto pb-2">
             <Button
               size="sm"
               variant={selectedPlatform === 'all' ? 'default' : 'outline'}
               onClick={() => setSelectedPlatform('all')}
               className={selectedPlatform === 'all' ? 'bg-[#01411C]' : ''}
             >
               الكل
             </Button>
             {SOCIAL_PLATFORMS.map((platform) => (
               <Button
                 key={platform.id}
                 size="sm"
                 variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                 onClick={() => setSelectedPlatform(platform.id)}
                 className={selectedPlatform === platform.id ? 'bg-[#01411C]' : ''}
               >
                 {platform.icon} {platform.name}
               </Button>
             ))}
           </div>
         </div>
 
         {/* قائمة المنشورات */}
         <div className="space-y-3">
           <h3 className="font-bold text-gray-800">أداء المنشورات</h3>
           
           {posts.length === 0 ? (
             <Card className="border-gray-200">
               <CardContent className="p-6 text-center">
                 <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                 <p className="text-gray-500">لا توجد منشورات لعرضها</p>
               </CardContent>
             </Card>
           ) : (
             posts.map((post) => {
               const platform = SOCIAL_PLATFORMS.find(p => p.id === post.platformId);
               return (
                 <Card key={post.id} className="border-gray-200">
                   <CardContent className="p-4">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex items-center gap-2">
                         <span className="text-xl">{platform?.icon}</span>
                         <div>
                           <h4 className="font-bold text-gray-900">{post.title}</h4>
                           <p className="text-xs text-gray-500">{post.publishedAt}</p>
                         </div>
                       </div>
                       <Badge 
                         className={
                           post.status === 'published' 
                             ? 'bg-green-500' 
                             : post.status === 'failed' 
                             ? 'bg-red-500' 
                             : 'bg-yellow-500'
                         }
                       >
                         {post.status === 'published' ? 'منشور' : post.status === 'failed' ? 'فشل' : 'قيد النشر'}
                       </Badge>
                     </div>
                     
                     <div className="grid grid-cols-4 gap-2 text-center">
                       <div className="p-2 bg-gray-50 rounded-lg">
                         <div className="font-bold text-gray-700">{post.views.toLocaleString()}</div>
                         <div className="text-xs text-gray-500">مشاهدة</div>
                       </div>
                       <div className="p-2 bg-gray-50 rounded-lg">
                         <div className="font-bold text-gray-700">{post.likes.toLocaleString()}</div>
                         <div className="text-xs text-gray-500">إعجاب</div>
                       </div>
                       <div className="p-2 bg-gray-50 rounded-lg">
                         <div className="font-bold text-gray-700">{post.comments}</div>
                         <div className="text-xs text-gray-500">تعليق</div>
                       </div>
                       <div className="p-2 bg-gray-50 rounded-lg">
                         <div className="font-bold text-gray-700">{post.shares}</div>
                         <div className="text-xs text-gray-500">مشاركة</div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               );
             })
           )}
         </div>
 
         {/* التنبيهات */}
         <Card className="border-amber-200 bg-amber-50">
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-amber-600" />
               التنبيهات
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2 text-sm">
               <div className="flex items-center gap-2 text-amber-700">
                 <TrendingDown className="w-4 h-4" />
                 انخفاض التفاعل على إنستغرام بنسبة 15%
               </div>
               <div className="flex items-center gap-2 text-amber-700">
                 <X className="w-4 h-4" />
                 فشل نشر منشور واحد على فيسبوك
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* ممنوعات */}
         <Card className="border-gray-300 bg-gray-50">
           <CardContent className="p-4 text-center text-sm text-gray-600">
             <p>⚠️ التحليلات ≠ الحملات ≠ النشر</p>
             <p>هذا التبويب = عرض بيانات فقط</p>
           </CardContent>
         </Card>
       </div>
     </ScrollArea>
   );
 }