/**
 * SlugQuotePage.tsx
 * صفحة طلب عرض السعر العامة
 * مع تصميم مطابق لـ FinancialDocumentModal
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracker } from '@/hooks/useEventTracker';
import { triggerReceivedDocumentNotification } from '@/utils/notificationTriggers';
import { 
  ArrowRight, Loader2, Send, FileText, Plus, Trash2, 
  Star, Building2, Phone, Mail, MapPin, Award, Shield,
  User, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface BusinessCardData {
  id: string;
  slug: string;
  user_id: string;
  data: {
    userName?: string;
    companyName?: string;
    primaryPhone?: string;
    email?: string;
    profileImage?: string;
    logoImage?: string;
    location?: string;
    falLicense?: string;
    coverImage?: string;
  };
}

interface QuoteItem {
  id: string;
  description: string;
  amount: number;
}

const SlugQuotePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trackPageView, track } = useEventTracker();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [swapped, setSwapped] = useState(false);
  
  // حالة النموذج
  const [items, setItems] = useState<QuoteItem[]>([{ id: '1', description: '', amount: 0 }]);
  const [vat, setVat] = useState(15);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // الحسابات التلقائية
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vat) / 100;
  const total = subtotal + vatAmount;

  useEffect(() => {
    const fetchBusinessCard = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setBusinessCard(data as BusinessCardData);
          trackPageView('quote_form', data.id, 'public_web');
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessCard();
  }, [slug]);

  // إضافة بند جديد
  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  // حذف بند
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // تحديث بند
  const updateItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'amount' ? Number(value) : value }
        : item
    ));
  };

  const handleSubmit = async () => {
    if (!agreeToTerms) {
      toast.error('يجب الموافقة على الشروط والأحكام');
      return;
    }
    if (!clientName || !clientPhone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    if (items.every(item => !item.description)) {
      toast.error('يرجى إدخال بند واحد على الأقل');
      return;
    }

    setIsSubmitting(true);
    
    // Track quote request
    track({
      eventName: 'quote_submit',
      channel: 'public_web',
      entityType: 'quote',
      entityId: businessCard?.id,
      metadata: { 
        propertyType, 
        city, 
        clientName,
        total,
        itemsCount: items.filter(i => i.description).length
      }
    });

    // إنشاء مستند عرض السعر المستلم
    const document = {
      id: `received_quote_${Date.now()}`,
      type: 'quotation_request',
      typeName: 'طلب عرض سعر مُستلَم',
      source: 'public_form',
      customerName: clientName,
      customerPhone: clientPhone,
      customerEmail: clientEmail,
      propertyType,
      city,
      notes,
      items: items.filter(i => i.description),
      subtotal,
      vatPercent: vat,
      vatAmount,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // إنشاء إشعار للوسيط مع حفظ المستند
    if (businessCard?.user_id) {
      await triggerReceivedDocumentNotification(businessCard.user_id, {
        clientName,
        documentType: 'quotation_request',
        total,
        document,
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowPreview(true);
    setIsSubmitting(false);
    toast.success('تم إرسال طلب عرض السعر بنجاح!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (notFound || !businessCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#01411C] to-[#065f41] text-white p-4">
        <h1 className="text-2xl font-bold mb-4">نموذج عرض السعر غير متاح</h1>
        <p className="text-gray-300 mb-6">لم يتم العثور على الصفحة المطلوبة</p>
        <Button onClick={() => navigate('/')} className="bg-[#D4AF37] text-[#01411C] hover:bg-[#b8941f]">
          <ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية
        </Button>
      </div>
    );
  }

  const cardData = businessCard.data;
  const brokerName = cardData?.userName || 'الوسيط';
  const brokerCompany = cardData?.companyName || '';
  const brokerPhone = cardData?.primaryPhone || '';
  const falLicense = cardData?.falLicense || '';
  
  // الصور
  const defaultProfileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(brokerName)}&background=01411C&color=D4AF37&size=192&bold=true&font-size=0.4`;
  const defaultLogoImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(brokerCompany || 'شركة')}&background=D4AF37&color=01411C&size=192&bold=true&font-size=0.35`;
  
  const profileImage = cardData?.profileImage || defaultProfileImage;
  const logoImage = cardData?.logoImage || defaultLogoImage;
  const coverImage = cardData?.coverImage;
  const mainImage = swapped ? logoImage : profileImage;
  const smallImage = swapped ? profileImage : logoImage;

  // شاشة المعاينة بعد الإرسال
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] p-4" dir="rtl">
        <Helmet>
          <title>تم إرسال طلب عرض السعر - {brokerName}</title>
        </Helmet>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* رأس بطاقة الأعمال */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-[#01411C] to-[#065f41] relative">
                {coverImage && (
                  <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              </div>

              <div className="absolute bottom-0 right-4 transform translate-y-1/2 flex items-end">
                <div className="relative cursor-pointer" onClick={() => setSwapped(!swapped)}>
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -left-2 bottom-0 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                    <img src={smallImage} alt="Secondary" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                ))}
              </div>
            </div>

            <div className="pt-16 px-4 pb-4 space-y-4">
              {/* معلومات الوسيط */}
              <div className="text-right">
                <h3 className="font-bold text-lg text-[#01411C]">{brokerName}</h3>
                <p className="text-sm text-gray-600">{brokerCompany}</p>
                {falLicense && (
                  <Badge variant="outline" className="mt-1 text-xs border-[#D4AF37] text-[#D4AF37]">
                    رخصة فال: {falLicense}
                  </Badge>
                )}
              </div>

              {/* رسالة النجاح */}
              <div className="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-700">تم إرسال طلبك بنجاح!</h2>
                <p className="text-sm text-gray-600 mt-2">سيتواصل معك الوسيط قريباً</p>
              </div>

              {/* ملخص الطلب */}
              <Card className="border-[#D4AF37]/30">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm text-gray-600">الاسم:</span>
                    <span className="font-bold text-gray-800">{clientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm text-gray-600">الجوال:</span>
                    <span className="font-medium text-gray-800 dir-ltr">{clientPhone}</span>
                  </div>
                  {total > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <DollarSign className="w-4 h-4 text-[#01411C]" />
                      <span className="text-sm text-gray-600">الميزانية المتوقعة:</span>
                      <span className="font-bold text-[#01411C]">{total.toLocaleString()} ر.س</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* زر الإغلاق */}
              <Button 
                onClick={() => navigate(`/${slug}`)}
                className="w-full bg-[#01411C] hover:bg-[#065f41] text-white"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>طلب عرض سعر - {brokerName}</title>
        <meta name="description" content={`اطلب عرض سعر من ${brokerName}`} />
        <link rel="canonical" href={`${window.location.origin}/${slug}/quote`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] p-4" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* رأس بطاقة الأعمال - مطابق لـ FinancialDocumentModal */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-[#01411C] to-[#065f41] relative">
                {coverImage && (
                  <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              </div>

              <div className="absolute bottom-0 right-4 transform translate-y-1/2 flex items-end">
                <div className="relative cursor-pointer" onClick={() => setSwapped(!swapped)}>
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -left-2 bottom-0 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                    <img src={smallImage} alt="Secondary" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                ))}
              </div>
            </div>

            {/* محتوى النموذج */}
            <div className="pt-16 px-4 pb-6 space-y-5">
              {/* معلومات الوسيط */}
              <div className="text-right">
                <h3 className="font-bold text-lg text-[#01411C]">{brokerName}</h3>
                <p className="text-sm text-gray-600">{brokerCompany}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {falLicense && (
                    <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37]">
                      <Award className="w-3 h-3 ml-1" />
                      رخصة فال: {falLicense}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                    <Shield className="w-3 h-3 ml-1" />
                    موثق
                  </Badge>
                </div>
                {brokerPhone && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{brokerPhone}</span>
                  </div>
                )}
              </div>

              {/* عنوان المستند */}
              <div className="text-center py-3 bg-gradient-to-r from-[#fffef7] to-[#f0fdf4] rounded-lg border border-[#D4AF37]">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                <h2 className="text-xl font-bold text-[#01411C]">طلب عرض سعر</h2>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              {/* معلومات العميل */}
              <Card className="border-[#D4AF37]/30">
                <CardContent className="p-4 space-y-4">
                  <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                    <User className="w-4 h-4" />
                    معلومات العميل
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">الاسم الكريم *</Label>
                      <Input 
                        value={clientName} 
                        onChange={(e) => setClientName(e.target.value)} 
                        placeholder="أدخل اسمك"
                        className="border-gray-300 focus:border-[#D4AF37]"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">رقم الجوال *</Label>
                      <Input 
                        type="tel" 
                        value={clientPhone} 
                        onChange={(e) => setClientPhone(e.target.value)} 
                        placeholder="05xxxxxxxx"
                        className="border-gray-300 focus:border-[#D4AF37]"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">البريد الإلكتروني (اختياري)</Label>
                      <Input 
                        type="email" 
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                        placeholder="email@example.com"
                        className="border-gray-300 focus:border-[#D4AF37]"
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">نوع العقار</Label>
                        <Input 
                          value={propertyType} 
                          onChange={(e) => setPropertyType(e.target.value)} 
                          placeholder="شقة، فيلا، أرض..."
                          className="border-gray-300 focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">المدينة</Label>
                        <Input 
                          value={city} 
                          onChange={(e) => setCity(e.target.value)} 
                          placeholder="المدينة"
                          className="border-gray-300 focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* بنود عرض السعر */}
              <Card className="border-[#D4AF37]/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#01411C] flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      تفاصيل الميزانية
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addItem}
                      className="text-xs border-[#D4AF37] text-[#01411C] hover:bg-[#D4AF37]/10"
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      إضافة بند
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                          <Input 
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder={`بند ${index + 1} - وصف الخدمة أو المتطلب`}
                            className="text-sm border-gray-300 focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="w-28 space-y-1">
                          <Input 
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                            placeholder="المبلغ"
                            className="text-sm border-gray-300 focus:border-[#D4AF37]"
                            dir="ltr"
                          />
                        </div>
                        {items.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* الضريبة والمجموع */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي</span>
                      <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">ضريبة القيمة المضافة</span>
                        <Input 
                          type="number"
                          value={vat}
                          onChange={(e) => setVat(Number(e.target.value))}
                          className="w-14 h-6 text-xs text-center p-1"
                          min={0}
                          max={100}
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                      <span className="font-medium">{vatAmount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span className="text-[#01411C]">الإجمالي المتوقع</span>
                      <span className="text-[#01411C]">{total.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ملاحظات إضافية */}
              <Card className="border-[#D4AF37]/30">
                <CardContent className="p-4 space-y-2">
                  <Label className="text-sm font-bold text-[#01411C]">ملاحظات إضافية</Label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي تفاصيل إضافية عن العقار أو متطلباتك..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#D4AF37] focus:outline-none resize-none"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* الموافقة على الشروط */}
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <Checkbox 
                  id="terms" 
                  checked={agreeToTerms} 
                  onCheckedChange={(checked) => setAgreeToTerms(checked === true)} 
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer text-gray-700">
                  أوافق على إرسال بياناتي للوسيط للتواصل معي
                </Label>
              </div>

              {/* زر الإرسال */}
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-[#01411C] to-[#065f41] hover:from-[#065f41] hover:to-[#01411C] text-white py-6 text-lg gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    إرسال طلب عرض السعر
                  </>
                )}
              </Button>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 pt-2">
                مدعوم من وساطة AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlugQuotePage;
