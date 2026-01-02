import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import PublicFormLayout, { BrokerInfo } from '@/pages/public-forms/PublicFormLayout';

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
  };
}

const SlugRequestPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [businessCard, setBusinessCard] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    propertyType: '',
    purpose: '',
    city: '',
    district: '',
    minArea: '',
    maxArea: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    notes: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    agreeToTerms: false,
  });

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
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessCard();
  }, [slug]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) {
      toast.error('يجب الموافقة على الشروط والأحكام');
      return;
    }
    if (!formData.clientName || !formData.clientPhone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('تم إرسال الطلب بنجاح!');
    setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold mb-4">نموذج إرسال الطلب غير متاح</h1>
        <p className="text-gray-300 mb-6">لم يتم العثور على الصفحة المطلوبة</p>
        <Button onClick={() => navigate('/')} className="bg-[#D4AF37] text-[#01411C] hover:bg-[#b8941f]">
          <ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية
        </Button>
      </div>
    );
  }

  const cardData = businessCard.data;
  const brokerInfo: BrokerInfo = {
    id: businessCard.user_id,
    name: cardData?.userName || 'الوسيط',
    company: cardData?.companyName || '',
    phone: cardData?.primaryPhone || '',
    email: cardData?.email || '',
    location: cardData?.location || '',
    licenseNumber: cardData?.falLicense || '',
    rating: 4.8,
    verified: true,
    profileImage: cardData?.profileImage,
  };

  return (
    <>
      <Helmet>
        <title>إرسال طلب عقاري - {brokerInfo.name}</title>
        <meta name="description" content={`أرسل طلبك العقاري إلى ${brokerInfo.name}`} />
        <link rel="canonical" href={`${window.location.origin}/${slug}/request`} />
      </Helmet>

      <PublicFormLayout broker={brokerInfo} title="إرسال طلب عقاري">
        <div className="space-y-6">
          {/* Property Type */}
          <div className="space-y-2">
            <Label>نوع العقار المطلوب</Label>
            <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
              <SelectTrigger><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">شقة</SelectItem>
                <SelectItem value="villa">فيلا</SelectItem>
                <SelectItem value="land">أرض</SelectItem>
                <SelectItem value="building">عمارة</SelectItem>
                <SelectItem value="office">مكتب</SelectItem>
                <SelectItem value="shop">محل تجاري</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label>الغرض</Label>
            <Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}>
              <SelectTrigger><SelectValue placeholder="اختر الغرض" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">شراء</SelectItem>
                <SelectItem value="rent">إيجار</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="المدينة" />
            </div>
            <div className="space-y-2">
              <Label>الحي (اختياري)</Label>
              <Input value={formData.district} onChange={(e) => updateField('district', e.target.value)} placeholder="الحي" />
            </div>
          </div>

          {/* Area Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحد الأدنى للمساحة (م²)</Label>
              <Input type="number" value={formData.minArea} onChange={(e) => updateField('minArea', e.target.value)} placeholder="من" />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للمساحة (م²)</Label>
              <Input type="number" value={formData.maxArea} onChange={(e) => updateField('maxArea', e.target.value)} placeholder="إلى" />
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحد الأدنى للسعر (ريال)</Label>
              <Input type="number" value={formData.minPrice} onChange={(e) => updateField('minPrice', e.target.value)} placeholder="من" />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للسعر (ريال)</Label>
              <Input type="number" value={formData.maxPrice} onChange={(e) => updateField('maxPrice', e.target.value)} placeholder="إلى" />
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>غرف النوم</Label>
              <Input type="number" value={formData.bedrooms} onChange={(e) => updateField('bedrooms', e.target.value)} placeholder="عدد الغرف" />
            </div>
            <div className="space-y-2">
              <Label>دورات المياه</Label>
              <Input type="number" value={formData.bathrooms} onChange={(e) => updateField('bathrooms', e.target.value)} placeholder="عدد الحمامات" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="أي متطلبات خاصة..." rows={4} />
          </div>

          {/* Client Info */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">معلومات التواصل</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={formData.clientName} onChange={(e) => updateField('clientName', e.target.value)} placeholder="اسمك الكريم" />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input type="tel" value={formData.clientPhone} onChange={(e) => updateField('clientPhone', e.target.value)} placeholder="05xxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني (اختياري)</Label>
                <Input type="email" value={formData.clientEmail} onChange={(e) => updateField('clientEmail', e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-2">
            <Checkbox id="terms" checked={formData.agreeToTerms} onCheckedChange={(checked) => updateField('agreeToTerms', checked === true)} />
            <Label htmlFor="terms" className="text-sm cursor-pointer">أوافق على الشروط والأحكام</Label>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-[#01411C] hover:bg-[#065f41] text-white py-6 text-lg">
            {isSubmitting ? <><Loader2 className="w-5 h-5 ml-2 animate-spin" />جاري الإرسال...</> : <><Search className="w-5 h-5 ml-2" />إرسال الطلب</>}
          </Button>
        </div>
      </PublicFormLayout>
    </>
  );
};

export default SlugRequestPage;
