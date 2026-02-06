/**
 * FacebookInstagramConnectionPanel.tsx
 * لوحة ربط حسابات Facebook و Instagram
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { toast } from 'sonner';
import { 
  Facebook, Instagram, Link2, Unlink, Check, Clock, 
  RefreshCw, User, Building2, AlertCircle, ExternalLink
} from 'lucide-react';

export default function FacebookInstagramConnectionPanel() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    pages, 
    startAuth, 
    disconnect,
    refreshToken,
    getAccounts
  } = useFacebookAuth();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getAccounts();
    setRefreshing(false);
    toast.success('تم تحديث الحسابات');
  };

  // Count Instagram accounts
  const instagramCount = pages.filter(p => p.instagram).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Facebook className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Instagram className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Facebook & Instagram</h2>
            <p className="text-white/80 text-sm">ربط حساباتك للنشر التلقائي</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isAuthenticated ? (
        <Card className="border-2 border-dashed border-blue-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Facebook className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">ربط حساب Facebook</h3>
            <p className="text-sm text-muted-foreground mb-4">
              سجل الدخول بحساب Facebook لربط صفحاتك وحسابات Instagram Business
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
              تسجيل الدخول بـ Facebook
            </Button>
            
            <div className="mt-4 p-3 bg-amber-50 rounded-lg text-right">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  يجب أن يكون لديك صلاحيات على صفحة Facebook وحساب Instagram Business مرتبط بها
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connected User */}
          <Card className="border-green-300 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold">{user?.name}</h4>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={disconnect}
                    className="text-red-600 border-red-300"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Facebook className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{pages.length}</div>
                <div className="text-sm text-blue-600">صفحات Facebook</div>
              </CardContent>
            </Card>
            <Card className="border-pink-200 bg-pink-50">
              <CardContent className="p-4 text-center">
                <Instagram className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-pink-700">{instagramCount}</div>
                <div className="text-sm text-pink-600">حسابات Instagram</div>
              </CardContent>
            </Card>
          </div>

          {/* Pages List */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800">الصفحات والحسابات المرتبطة</h3>
            
            {pages.length === 0 ? (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-700">
                    لم يتم العثور على صفحات. تأكد من أن لديك صلاحيات إدارة على صفحة Facebook واحدة على الأقل.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3">
                  {pages.map((page) => (
                    <Card key={page.id} className="border-gray-200">
                      <CardContent className="p-4">
                        {/* Facebook Page */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{page.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500">
                                <Facebook className="w-3 h-3 ml-1" />
                                صفحة
                              </Badge>
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <Check className="w-3 h-3 ml-1" />
                                مرتبط
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Instagram Account (if linked) */}
                        {page.instagram && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            {page.instagram.profile_picture_url ? (
                              <img 
                                src={page.instagram.profile_picture_url} 
                                alt={page.instagram.username}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                                <Instagram className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">@{page.instagram.username}</h4>
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                                <Instagram className="w-3 h-3 ml-1" />
                                Instagram Business
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* No Instagram linked */}
                        {!page.instagram && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertCircle className="w-4 h-4" />
                              <p className="text-sm">لا يوجد حساب Instagram Business مرتبط بهذه الصفحة</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Help Link */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-3">
              <a 
                href="https://www.facebook.com/business/help/898752960195806" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                كيفية ربط Instagram Business بصفحة Facebook
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
