'use client';

import { useState } from 'react';
import { CreditCard, Plus, QrCode, Eye, Share2, TrendingUp, Users, MousePointer, RefreshCw, BarChart3, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardsGrid } from './CardsGrid';
import { CreateCardDialog } from './CreateCardDialog';
import { CardStatsOverview } from './CardStatsOverview';
import { CardDesigner } from './CardDesigner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for cards
const mockCards = [
  {
    id: '1',
    slug: 'ahmed-broker',
    fullName: 'أحمد محمد',
    jobTitle: 'وسيط عقاري معتمد',
    company: 'نوفا العقارية',
    email: 'ahmed@nova.com',
    phone: '+966501234567',
    whatsapp: '+966501234567',
    bio: 'وسيط عقاري معتمد من الهيئة العامة للعقار، متخصص في العقارات السكنية والتجارية.',
    website: 'https://nova.com',
    city: 'الرياض',
    country: 'Saudi Arabia',
    linkedin: 'https://linkedin.com/in/ahmed',
    instagram: 'https://instagram.com/ahmed',
    twitter: 'https://twitter.com/ahmed',
    profilePhoto: null,
    coverPhoto: null,
    primaryColor: '#01411C',
    secondaryColor: '#D4AF37',
    template: 'modern',
    layout: 'standard',
    totalViews: 1250,
    totalScans: 89,
    totalClicks: 456,
    totalSaves: 34,
    isActive: true,
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasata.ai/cards/ahmed-broker',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    slug: 'mohammed-realestate',
    fullName: 'محمد علي',
    jobTitle: 'مستشار عقاري',
    company: 'العقارات الذهبية',
    email: 'mohammed@golden.com',
    phone: '+966502345678',
    whatsapp: '+966502345678',
    bio: 'مستشار عقاري متخصص في التسويق العقاري.',
    website: 'https://golden.com',
    city: 'جدة',
    country: 'Saudi Arabia',
    linkedin: null,
    instagram: 'https://instagram.com/mohammed',
    twitter: null,
    profilePhoto: null,
    coverPhoto: null,
    primaryColor: '#1a1a1a',
    secondaryColor: '#DAA520',
    template: 'luxury',
    layout: 'creative',
    totalViews: 890,
    totalScans: 45,
    totalClicks: 234,
    totalSaves: 21,
    isActive: true,
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasata.ai/cards/mohammed-realestate',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock stats
const mockStats = {
  totalCards: 2,
  totalViews: 2140,
  totalScans: 134,
  totalClicks: 690,
  totalSaves: 55,
  viewsChange: 15.5,
  scansChange: 22.3,
  clicksChange: 8.7,
};

interface DigitalCardDashboardProps {
  onBack?: () => void;
}

export function DigitalCardDashboard({ onBack }: DigitalCardDashboardProps) {
  const [cards, setCards] = useState(mockCards);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
      country: 'Saudi Arabia',
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
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wasata.ai/cards/${data.slug}`,
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
            <CardsGrid 
              cards={cards} 
              onDelete={handleDeleteCard}
              onToggleActive={handleToggleActive}
              onEdit={(card) => console.log('Edit card:', card)}
            />
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
                  <p className="text-xs text-green-500 mt-1">+{mockStats.viewsChange}% هذا الشهر</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600">مسحات QR</span>
                    <QrCode className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{mockStats.totalScans.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-blue-500 mt-1">+{mockStats.scansChange}% هذا الشهر</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-600">النقرات</span>
                    <MousePointer className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-800">{mockStats.totalClicks.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-purple-500 mt-1">+{mockStats.clicksChange}% هذا الشهر</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-600">الحفظ في جهات الاتصال</span>
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-amber-800">{mockStats.totalSaves.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-amber-500 mt-1">نسبة التحويل: {((mockStats.totalSaves / mockStats.totalViews) * 100).toFixed(1)}%</p>
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
