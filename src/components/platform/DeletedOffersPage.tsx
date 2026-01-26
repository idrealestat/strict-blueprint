/**
 * DeletedOffersPage.tsx
 * صفحة استعادة العروض المحذوفة مع خيار الإفراغ الكامل
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowRight, 
  RotateCcw, 
  Trash2, 
  AlertTriangle,
  MapPin,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';

interface DeletedOffer {
  id: string;
  title: string;
  city: string;
  district: string;
  price: string;
  image: string;
  deletedAt: string;
  propertyType: string;
}

interface DeletedOffersPageProps {
  onBack: () => void;
  onRestore: (offerId: string) => void;
}

const DELETED_OFFERS_KEY = 'wasata_deleted_offers';

export default function DeletedOffersPage({ onBack, onRestore }: DeletedOffersPageProps) {
  const [deletedOffers, setDeletedOffers] = useState<DeletedOffer[]>([]);
  const [showEmptyAllConfirm, setShowEmptyAllConfirm] = useState(false);

  // تحميل العروض المحذوفة
  useEffect(() => {
    loadDeletedOffers();
  }, []);

  const loadDeletedOffers = () => {
    try {
      const saved = localStorage.getItem(DELETED_OFFERS_KEY);
      if (saved) {
        setDeletedOffers(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading deleted offers:', error);
    }
  };

  // استعادة عرض محذوف
  const handleRestore = (offer: DeletedOffer) => {
    // إزالة من المحذوفات
    const updated = deletedOffers.filter(o => o.id !== offer.id);
    setDeletedOffers(updated);
    localStorage.setItem(DELETED_OFFERS_KEY, JSON.stringify(updated));

    // استعادة للقائمة الرئيسية
    onRestore(offer.id);

    toast.success('تم استعادة العرض بنجاح', {
      description: offer.title,
    });
  };

  // حذف عرض نهائياً
  const handlePermanentDelete = (offerId: string) => {
    const updated = deletedOffers.filter(o => o.id !== offerId);
    setDeletedOffers(updated);
    localStorage.setItem(DELETED_OFFERS_KEY, JSON.stringify(updated));
    toast.success('تم الحذف نهائياً');
  };

  // إفراغ كامل
  const handleEmptyAll = () => {
    setDeletedOffers([]);
    localStorage.setItem(DELETED_OFFERS_KEY, '[]');
    setShowEmptyAllConfirm(false);
    toast.success('تم إفراغ سلة المحذوفات نهائياً', {
      description: 'لا يمكن استعادة هذه العروض',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#01411C] text-white border-b-4 border-[#D4AF37] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                سلة المحذوفات
              </h1>
            </div>

            {deletedOffers.length > 0 && (
              <Button
                onClick={() => setShowEmptyAllConfirm(true)}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                إفراغ الكل
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {deletedOffers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trash2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">سلة المحذوفات فارغة</h3>
              <p className="text-gray-500">لا توجد عروض محذوفة يمكن استعادتها</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              يمكنك استعادة العروض المحذوفة من هنا. بعد الإفراغ الكامل لن تتمكن من الاستعادة.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deletedOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border-2 border-gray-200 hover:border-[#D4AF37] transition-all">
                  <div className="relative h-32">
                    <img 
                      src={offer.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'} 
                      alt={offer.title} 
                      className="w-full h-full object-cover opacity-70"
                    />
                    <Badge className="absolute top-2 right-2 bg-red-500">محذوف</Badge>
                    <Badge className="absolute top-2 left-2 bg-gray-600 text-xs">
                      {new Date(offer.deletedAt).toLocaleDateString('ar-SA')}
                    </Badge>
                  </div>

                  <CardContent className="p-3">
                    <h4 className="font-bold text-[#01411C] line-clamp-1 mb-1">{offer.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {offer.city} - {offer.district}
                    </p>
                    <p className="text-sm font-bold text-[#D4AF37] mb-3">{offer.price}</p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRestore(offer)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <RotateCcw className="w-4 h-4 ml-1" />
                        استعادة
                      </Button>
                      <Button
                        onClick={() => handlePermanentDelete(offer.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Alert Dialog - تأكيد الإفراغ الكامل */}
      <AlertDialog open={showEmptyAllConfirm} onOpenChange={setShowEmptyAllConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              تأكيد الإفراغ الكامل
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <p className="mb-2">هل أنت متأكد من إفراغ سلة المحذوفات نهائياً؟</p>
              <p className="text-red-600 font-bold">
                ⚠️ لا يمكن استعادة العروض بعد هذه العملية!
              </p>
              <p className="mt-2 text-sm text-gray-500">
                سيتم حذف {deletedOffers.length} عرض نهائياً
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyAll}
              className="bg-red-600 hover:bg-red-700"
            >
              نعم، إفراغ الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// دالة مساعدة لإضافة عرض للمحذوفات
export function addToDeletedOffers(offer: {
  id: string;
  title: string;
  city: string;
  district: string;
  price: string;
  image: string;
  propertyType: string;
}) {
  try {
    const saved = localStorage.getItem(DELETED_OFFERS_KEY);
    const deletedOffers = saved ? JSON.parse(saved) : [];
    
    // التأكد من عدم التكرار
    if (!deletedOffers.some((o: DeletedOffer) => o.id === offer.id)) {
      deletedOffers.unshift({
        ...offer,
        deletedAt: new Date().toISOString(),
      });
      localStorage.setItem(DELETED_OFFERS_KEY, JSON.stringify(deletedOffers));
    }
  } catch (error) {
    console.error('Error adding to deleted offers:', error);
  }
}

// دالة مساعدة لاستعادة عرض من المحذوفات
export function restoreFromDeletedOffers(offerId: string): DeletedOffer | null {
  try {
    const saved = localStorage.getItem(DELETED_OFFERS_KEY);
    if (!saved) return null;
    
    const deletedOffers: DeletedOffer[] = JSON.parse(saved);
    const offer = deletedOffers.find(o => o.id === offerId);
    
    if (offer) {
      const updated = deletedOffers.filter(o => o.id !== offerId);
      localStorage.setItem(DELETED_OFFERS_KEY, JSON.stringify(updated));
      return offer;
    }
    
    return null;
  } catch (error) {
    console.error('Error restoring offer:', error);
    return null;
  }
}
