'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, QrCode, Eye, Share2, TrendingUp, Users, MousePointer, RefreshCw, BarChart3, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardsGrid } from './CardsGrid';
import { CreateCardDialog } from './CreateCardDialog';
import { CardStatsOverview } from './CardStatsOverview';
import { CardDesigner } from './CardDesigner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

// Mock stats (يمكن استبدالها لاحقاً ببيانات حقيقية)
const mockStats = {
  totalCards: 1,
  totalViews: 0,
  totalScans: 0,
  totalClicks: 0,
  totalSaves: 0,
  viewsChange: 0,
  scansChange: 0,
  clicksChange: 0,
};

interface DigitalCardDashboardProps {
  onBack?: () => void;
}

export function DigitalCardDashboard({ onBack }: DigitalCardDashboardProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // جلب بيانات البطاقة الحقيقية من business_cards
  const loadRealCardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: businessCard, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[DigitalCardDashboard] Error loading card:', error);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, company_name, fal_license_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (businessCard?.data) {
        const cardData = businessCard.data as Record<string, any>;
        
        const realCard = {
          id: businessCard.id,
          slug: businessCard.slug || 'my-card',
          fullName: cardData.userName || profile?.full_name || '',
          jobTitle: cardData.userTitle || 'وسيط عقاري معتمد',
          company: cardData.companyName || profile?.company_name || '',
          email: businessCard.email || cardData.email || user.email || '',
          phone: cardData.primaryPhone || profile?.phone || '',
          whatsapp: cardData.whatsappPhone || cardData.primaryPhone || profile?.phone || '',
          bio: cardData.bio || '',
          website: cardData.websiteUrl || '',
          city: cardData.location || '',
          country: 'السعودية',
          linkedin: cardData.socialMedia?.linkedin || null,
          instagram: cardData.socialMedia?.instagram || null,
          twitter: cardData.socialMedia?.twitter || null,
          profilePhoto: cardData.profileImage || null,
          coverPhoto: cardData.coverImage || null,
          primaryColor: '#01411C',
          secondaryColor: '#D4AF37',
          template: 'modern',
          layout: 'standard',
          totalViews: 0,
          totalScans: 0,
          totalClicks: 0,
          totalSaves: 0,
          isActive: businessCard.published || false,
          qrCode: businessCard.slug
            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasataai.com/${businessCard.slug}/card`
            : '',
          createdAt: businessCard.created_at,
        };
        setCards([realCard]);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('[DigitalCardDashboard] Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealCardData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRealCardData();
    setIsRefreshing(false);
  };

  const handleCreateCard = (data: any) => {
    const newCard = {
      id: String(cards.length + 1),
      slug: data.slug,
      fullName: data.fullName,
      jobTitle: data.jobTitle || '',
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      whatsapp: data.phone || '',
      bio: data.bio || '',
      website: '',
      city: 'الرياض',
      country: 'السعودية',
      linkedin: null,
      instagram: null,
      twitter: null,
      profilePhoto: null,
      coverPhoto: null,
      primaryColor: '#01411C',
      secondaryColor: '#D4AF37',
      template: data.template,
      layout: data.layout,
      totalViews: 0,
      totalScans: 0,
      totalClicks: 0,
      totalSaves: 0,
      isActive: true,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasataai.com/cards/${data.slug}`,
      createdAt: new Date().toISOString(),
    };
    setCards([newCard, ...cards]);
    setShowCreateDialog(false);
  };

  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setCards(cards.map(card => 
      card.id === id ? { ...card, isActive: !card.isActive } : card
    ));
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] text-white p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
                  رجوع
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <CreditCard className="h-8 w-8 text-[#D4AF37]" />
                  بطاقات الأعمال الرقمية
                </h1>
                <p className="text-white/80 mt-1">
                  أنشئ وأدر بطاقات أعمالك الرقمية مع رمز QR
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                <RefreshCw className={`ml-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/90"
              >
                <Plus className="ml-2 h-4 w-4" />
                بطاقة جديدة
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats */}
        <CardStatsOverview stats={mockStats} className="mb-6" />

        {/* Tabs */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="cards" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 ml-2" />
              بطاقاتي ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="designer" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              <Palette className="h-4 w-4 ml-2" />
              مصمم البطاقات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#01411C] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 ml-2" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <CardsGrid 
                cards={cards} 
                onDelete={handleDeleteCard}
                onToggleActive={handleToggleActive}
                onEdit={(card) => console.log('Edit card:', card)}
              />
            )}
          </TabsContent>

          <TabsContent value="designer" className="mt-6">
            <CardDesigner />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#01411C]" />
                تحليلات البطاقات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-600">إجمالي المشاهدات</span>
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-800">{mockStats.totalViews.toLocaleString('ar-SA')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600">مسحات QR</span>
                    <QrCode className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{mockStats.totalScans.toLocaleString('ar-SA')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-600">النقرات</span>
                    <MousePointer className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-800">{mockStats.totalClicks.toLocaleString('ar-SA')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-600">الحفظ في جهات الاتصال</span>
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-amber-800">{mockStats.totalSaves.toLocaleString('ar-SA')}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <CreateCardDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateCard}
      />
    </div>
  );
}
