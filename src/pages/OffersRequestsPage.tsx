import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSmartOpportunities } from '@/hooks/useSmartOpportunities';
import { AcceptedOpportunityCard } from '@/components/smart-opportunities/AcceptedOpportunityCard';
import MainLayout from '@/components/layout/MainLayout';
import { FileText, ShoppingCart, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const OffersRequestsPage = () => {
  const navigate = useNavigate();
  const { 
    acceptedOffers, 
    acceptedRequests, 
    unviewedCount, 
    isLoading, 
    markAsViewed 
  } = useSmartOpportunities();
  
  const [activeTab, setActiveTab] = useState('offers');

  // تحديث حالة المشاهدة عند فتح الصفحة
  useEffect(() => {
    if (unviewedCount > 0) {
      markAsViewed();
    }
  }, [unviewedCount, markAsViewed]);

  const unviewedOffers = acceptedOffers.filter(a => !a.viewed_by_owner).length;
  const unviewedRequests = acceptedRequests.filter(a => !a.viewed_by_owner).length;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/app/dashboard')}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                العروض والطلبات
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                إدارة العروض والطلبات المقبولة من الفرص الذكية
              </p>
            </div>
          </div>
          
          {unviewedCount > 0 && (
            <Badge className="bg-emerald-500 text-white animate-pulse">
              <Sparkles className="w-3 h-3 ml-1" />
              {unviewedCount} جديد
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="offers" className="gap-2 relative">
              <ShoppingCart className="w-4 h-4" />
              العروض المقبولة
              {unviewedOffers > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unviewedOffers}
                </Badge>
              )}
              <Badge variant="secondary" className="mr-1">
                {acceptedOffers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 relative">
              <FileText className="w-4 h-4" />
              الطلبات المقبولة
              {unviewedRequests > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unviewedRequests}
                </Badge>
              )}
              <Badge variant="secondary" className="mr-1">
                {acceptedRequests.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* العروض المقبولة */}
          <TabsContent value="offers" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : acceptedOffers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    لا توجد عروض مقبولة
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    ستظهر هنا العروض التي تم قبولها من الفرص الذكية
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2"
                    onClick={() => navigate('/app/smart-opportunities')}
                  >
                    <Sparkles className="w-4 h-4" />
                    استكشاف الفرص الذكية
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {acceptedOffers.map((acceptance) => (
                  <AcceptedOpportunityCard
                    key={acceptance.id}
                    acceptance={acceptance}
                    type="offer"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* الطلبات المقبولة */}
          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : acceptedRequests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    لا توجد طلبات مقبولة
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    ستظهر هنا الطلبات التي تم قبولها من الفرص الذكية
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2"
                    onClick={() => navigate('/app/smart-opportunities')}
                  >
                    <Sparkles className="w-4 h-4" />
                    استكشاف الفرص الذكية
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {acceptedRequests.map((acceptance) => (
                  <AcceptedOpportunityCard
                    key={acceptance.id}
                    acceptance={acceptance}
                    type="request"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default OffersRequestsPage;
