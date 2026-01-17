/**
 * TabActionsPanel.tsx
 * مكون أزرار الإجراءات للتبويبات: PDF، إعادة نشر، إرسال
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, RefreshCw, Send, FileText, Loader2, Calendar, Clock, MapPin, Home, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';

interface TabData {
  id: string;
  name: string;
  type: 'property_offer' | 'property_request' | 'price_quote' | 'appointment' | 'published_ad' | string;
  data: any;
  createdAt: string;
  isNew?: boolean;
  isPublished?: boolean;
  publishedAdId?: string;
  publishedAt?: string;
}

interface BrokerInfo {
  name?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  company?: string;
}

interface TabActionsPanelProps {
  tab: TabData;
  customerName: string;
  customerPhone: string;
  brokerInfo?: BrokerInfo;
  onRepublish?: (data: any) => void;
  onViewDetails?: (data: any) => void;
}

export default function TabActionsPanel({ tab, customerName, customerPhone, brokerInfo, onRepublish, onViewDetails }: TabActionsPanelProps) {
  const navigate = useNavigate();
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [includeOwnerInfo, setIncludeOwnerInfo] = useState(true);
  const [includeBrokerInfo, setIncludeBrokerInfo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Arabic font support (basic)
      doc.setFont('helvetica');
      
      const data = tab.data;
      let yPosition = 20;
      const lineHeight = 8;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(1, 65, 28); // Forest green
      const title = tab.type === 'property_offer' ? 'عرض عقاري' :
                   tab.type === 'property_request' ? 'طلب عقار' :
                   tab.type === 'price_quote' ? 'عرض سعر' :
                   tab.type === 'appointment' ? 'موعد' : 'تفاصيل';
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`التاريخ: ${new Date(tab.createdAt).toLocaleDateString('ar-SA')}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += lineHeight * 2;

      // Owner/Client Info
      if (includeOwnerInfo && data) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('معلومات العميل', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        const ownerName = data.ownerName || data.clientName || customerName;
        const ownerPhone = data.ownerPhone || data.clientPhone || customerPhone;
        
        doc.text(`الاسم: ${ownerName}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        doc.text(`الجوال: ${ownerPhone}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        if (data.ownerIdNumber) {
          doc.text(`رقم الهوية: ${data.ownerIdNumber}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight;
      }

      // Broker Info - معلومات الوسيط
      if (includeBrokerInfo && brokerInfo) {
        doc.setFontSize(14);
        doc.setTextColor(1, 65, 28); // Forest green
        doc.text('معلومات الوسيط', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (brokerInfo.name) {
          doc.text(`الاسم: ${brokerInfo.name}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (brokerInfo.phone) {
          doc.text(`الجوال: ${brokerInfo.phone}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (brokerInfo.email) {
          doc.text(`البريد: ${brokerInfo.email}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (brokerInfo.licenseNumber) {
          doc.text(`رقم الترخيص: ${brokerInfo.licenseNumber}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (brokerInfo.company) {
          doc.text(`الشركة: ${brokerInfo.company}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight;
      }

      if (tab.type === 'property_offer' || tab.type === 'property_request') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('معلومات العقار', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.propertyType) {
          doc.text(`نوع العقار: ${data.propertyType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.purpose) {
          doc.text(`الغرض: ${data.purpose}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.city) {
          doc.text(`المدينة: ${data.city}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.district) {
          doc.text(`الحي: ${data.district}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.area) {
          doc.text(`المساحة: ${data.area} م²`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.price) {
          doc.text(`السعر: ${Number(data.price).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        
        // حقول الدفعات للإيجار
        if (data.purpose === 'للإيجار' && data.paymentPrices) {
          yPosition += lineHeight;
          doc.setFontSize(12);
          doc.setTextColor(1, 65, 28);
          doc.text('خيارات الدفعات:', pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
          
          doc.setFontSize(11);
          doc.setTextColor(60);
          
          if (data.paymentPrices.onePayment) {
            doc.text(`دفعة واحدة: ${Number(data.paymentPrices.onePayment).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          }
          if (data.paymentPrices.twoPayments) {
            doc.text(`دفعتين: ${Number(data.paymentPrices.twoPayments).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          }
          if (data.paymentPrices.fourPayments) {
            doc.text(`أربع دفعات: ${Number(data.paymentPrices.fourPayments).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          }
          if (data.paymentPrices.monthly) {
            doc.text(`شهري: ${Number(data.paymentPrices.monthly).toLocaleString()} ريال`, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          }
        }
        if (data.bedrooms) {
          doc.text(`غرف النوم: ${data.bedrooms}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.bathrooms) {
          doc.text(`دورات المياه: ${data.bathrooms}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.description) {
          yPosition += lineHeight;
          doc.text('الوصف:', pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
          
          // Split long description
          const descLines = doc.splitTextToSize(data.description, pageWidth - 40);
          descLines.forEach((line: string) => {
            doc.text(line, pageWidth - 20, yPosition, { align: 'right' });
            yPosition += lineHeight;
          });
        }
      }

      // Appointment Info
      if (tab.type === 'appointment') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('تفاصيل الموعد', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.appointmentType) {
          doc.text(`نوع الموعد: ${data.appointmentType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.preferredDate) {
          doc.text(`التاريخ: ${data.preferredDate}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.preferredTime) {
          doc.text(`الوقت: ${data.preferredTime}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.meetingLocation) {
          doc.text(`المكان: ${data.meetingLocation}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
      }

      // Price Quote Info
      if (tab.type === 'price_quote') {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('تفاصيل عرض السعر', pageWidth - 20, yPosition, { align: 'right' });
        yPosition += lineHeight;
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        
        if (data.quoteType) {
          doc.text(`نوع الخدمة: ${data.quoteType}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
        if (data.budget) {
          doc.text(`الميزانية: ${data.budget} ريال`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += lineHeight;
        }
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('تم إنشاؤه بواسطة منصة وساطة', pageWidth / 2, 280, { align: 'center' });

      // Save PDF
      const fileName = `${title}_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('تم تحميل PDF بنجاح');
      setShowPdfDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle republish - navigate to publish form with auto-fill
  const handleRepublish = () => {
    if (tab.type === 'property_offer') {
      // تحويل البيانات لتتوافق مع نموذج النشر
      const republishData = {
        // معلومات المالك
        ownerName: tab.data.ownerName || '',
        ownerPhone: tab.data.ownerPhone || '',
        ownerIdNumber: tab.data.ownerIdNumber || '',
        ownerNationalAddress: tab.data.ownerNationalAddress || '',
        ownerCity: tab.data.ownerCity || '',
        
        // معلومات الصك
        deedNumber: tab.data.deedNumber || '',
        deedDate: tab.data.deedDate || '',
        deedCity: tab.data.deedCity || '',
        
        // معلومات العقار
        propertyType: tab.data.propertyType || '',
        purpose: tab.data.purpose || '',
        area: tab.data.area || '',
        price: tab.data.price || '',
        
        // خيارات الدفعات
        paymentPrices: tab.data.paymentPrices || {
          onePayment: '',
          twoPayments: '',
          fourPayments: '',
          monthly: '',
        },
        
        // الموقع
        locationDetails: {
          city: tab.data.city || '',
          district: tab.data.district || '',
          street: tab.data.street || '',
          buildingNumber: '',
          postalCode: '',
          additionalNumber: '',
          latitude: 24.7136,
          longitude: 46.6753,
        },
        
        // المواصفات
        floors: tab.data.floors || '',
        floorNumber: tab.data.floorNumber || '',
        bedrooms: tab.data.bedrooms || '',
        bathrooms: tab.data.bathrooms || '',
        livingRooms: tab.data.livingRooms || '',
        councils: tab.data.councils || '',
        streetWidth: tab.data.streetWidth || '',
        facade: tab.data.facade || '',
        furnishing: tab.data.furnishing || '',
        propertyAge: tab.data.propertyAge || '',
        
        // معلومات إضافية
        entrances: tab.data.entrances || '',
        warehouses: tab.data.warehouses || '',
        hasLaundryRoom: tab.data.hasLaundryRoom || false,
        balconies: tab.data.balconies || '',
        acUnits: tab.data.acUnits || '',
        hasExtraKitchen: tab.data.hasExtraKitchen || false,
        
        // الضمانات
        warranties: tab.data.warranties || [],
        
        // الوسائط - الصور والفيديو ورابط الجولة 3D
        media: tab.data.media || [],
        tour3DUrl: tab.data.tour3dUrl || tab.data.tour3DUrl || '',
        
        // الوصف
        aiDescription: tab.data.description || '',
        
        // مصدر البيانات
        source: 'customer_tab',
        originalTabId: tab.id,
      };
      
      // حفظ البيانات بالاسم الصحيح الذي يبحث عنه PropertyPublishForm
      localStorage.setItem('wasata_republish_data', JSON.stringify(republishData));
      
      // Trigger republish callback if provided
      if (onRepublish) {
        onRepublish(tab.data);
      }
      
      toast.success('جاري الانتقال إلى صفحة النشر...');
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('republishOffer', { 
        detail: tab.data 
      }));
      
      // فتح "منصتي" ثم فتح نموذج نشر الإعلان داخلها
      navigate('/app/dashboard');
      window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'dashboard-main-252' } }));
      window.setTimeout(() => {
        window.dispatchEvent(new Event('wasata:openPublishAd'));
      }, 250);
      
    } else if (tab.type === 'property_request') {
      // حفظ بيانات الطلب لنشره في قسم الطلبات
      const requestData = {
        // معلومات العميل
        clientName: tab.data.clientName || '',
        clientPhone: tab.data.clientPhone || '',
        clientIdNumber: tab.data.clientIdNumber || '',
        clientNationalAddress: tab.data.clientNationalAddress || '',
        
        // معلومات الطلب
        propertyType: tab.data.propertyType || '',
        purpose: tab.data.purpose || '',
        preferredCity: tab.data.preferredCity || '',
        preferredDistricts: tab.data.preferredDistricts || '',
        
        // المواصفات
        minArea: tab.data.minArea || '',
        maxArea: tab.data.maxArea || '',
        bedrooms: tab.data.bedrooms || '',
        bathrooms: tab.data.bathrooms || '',
        livingRooms: tab.data.livingRooms || '',
        floors: tab.data.floors || '',
        furnishing: tab.data.furnishing || '',
        
        // الميزانية
        minBudget: tab.data.minBudget || '',
        maxBudget: tab.data.maxBudget || '',
        
        // خيارات الدفعات
        paymentPrices: tab.data.paymentPrices || {
          onePayment: '',
          twoPayments: '',
          fourPayments: '',
          monthly: '',
        },
        
        // الميزات
        hasPool: tab.data.hasPool || false,
        hasGarden: tab.data.hasGarden || false,
        hasElevator: tab.data.hasElevator || false,
        hasParking: tab.data.hasParking || false,
        hasMaidRoom: tab.data.hasMaidRoom || false,
        hasDriverRoom: tab.data.hasDriverRoom || false,
        
        // متطلبات إضافية
        additionalRequirements: tab.data.additionalRequirements || '',
        urgency: tab.data.urgency || 'normal',
        
        // معلومات التتبع
        source: 'customer_tab',
        originalTabId: tab.id,
      };
      
      localStorage.setItem('wasata_republish_request', JSON.stringify(requestData));
      
      if (onRepublish) {
        onRepublish(tab.data);
      }
      
      toast.success('جاري إضافة الطلب إلى قسم الطلبات...');
      
      // إرسال حدث لإضافة الطلب مباشرة لقسم الطلبات
      window.dispatchEvent(new CustomEvent('addRequestToRequests', { 
        detail: requestData 
      }));
      
      // فتح "منصتي" ثم الانتقال لتبويب الطلبات
      navigate('/app/dashboard');
      window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'dashboard-main-252' } }));
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'dashboard-main-252' } }));
        window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: 'dashboard-main-252' } }));
      }, 50);
      window.setTimeout(() => {
        // يعتمد على مستمع addRequestToRequests الموجود مسبقاً + التخزين wasata_republish_request
      }, 250);
    }
  };

  // Render different actions based on tab type
  const renderActions = () => {
    switch (tab.type) {
      case 'property_offer':
        const isPublished = tab.data?.isPublished || tab.isPublished;
        const publishedAdId = tab.data?.publishedAdId || tab.publishedAdId;
        
        return (
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
            {/* شارة حالة النشر */}
            {isPublished && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">تم نشر هذا العرض كإعلان</span>
                {publishedAdId && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    #{publishedAdId.slice(-6)}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleRepublish}
                className={`flex items-center gap-2 ${isPublished ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#01411C] hover:bg-[#065f41]'}`}
              >
                <Send className="w-4 h-4" />
                {isPublished ? 'نشر مرة أخرى' : 'نشر الإعلان'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPdfDialog(true)}
                className="flex items-center gap-2 border-[#D4AF37] text-[#01411C]"
              >
                <Download className="w-4 h-4" />
                تحميل PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onViewDetails) {
                    onViewDetails(tab.data);
                  } else {
                    setShowDetailsDialog(true);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                عرض التفاصيل
              </Button>
            </div>
          </div>
        );
      
      case 'property_request':
        const isRequestPublished = tab.data?.isPublished || tab.isPublished;
        const publishedRequestId = tab.data?.publishedAdId || tab.publishedAdId;
        
        return (
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
            {/* شارة حالة النشر */}
            {isRequestPublished && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">تم نشر هذا الطلب في قسم الطلبات</span>
                {publishedRequestId && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    #{publishedRequestId.slice(-6)}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleRepublish}
                className={`flex items-center gap-2 ${isRequestPublished ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Send className="w-4 h-4" />
                {isRequestPublished ? 'نشر مرة أخرى' : 'إرسال لقسم الطلبات'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPdfDialog(true)}
                className="flex items-center gap-2 border-blue-300 text-blue-700"
              >
                <Download className="w-4 h-4" />
                تحميل PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsDialog(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                عرض التفاصيل
              </Button>
            </div>
          </div>
        );
      
      case 'price_quote':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
          </div>
        );
      
      case 'appointment':
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                toast.success('تم فتح التقويم');
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Calendar className="w-4 h-4" />
              عرض في التقويم
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل PDF
            </Button>
          </div>
        );
    }
  };

  // Render tab content
  const renderTabContent = () => {
    const data = tab.data;
    if (!data) return null;

    switch (tab.type) {
      case 'property_offer':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {data.propertyType && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{data.propertyType}</span>
                </div>
              )}
              {data.purpose && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{data.purpose}</span>
                </div>
              )}
              {data.city && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-sm">{data.city} {data.district && `- ${data.district}`}</span>
                </div>
              )}
              {data.price && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <span className="text-sm font-bold text-purple-700">
                    {Number(data.price).toLocaleString()} ريال
                  </span>
                </div>
              )}
            </div>
            {data.area && (
              <p className="text-sm text-gray-600">المساحة: {data.area} م²</p>
            )}
            {data.bedrooms && data.bathrooms && (
              <p className="text-sm text-gray-600">
                {data.bedrooms} غرف نوم • {data.bathrooms} دورات مياه
              </p>
            )}
            {data.media && data.media.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mt-2">
                {data.media.slice(0, 4).map((m: any, i: number) => (
                  <img 
                    key={i} 
                    src={m.url} 
                    alt={`Property ${i + 1}`}
                    className="aspect-square object-cover rounded"
                  />
                ))}
                {data.media.length > 4 && (
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                    +{data.media.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'appointment':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">{data.appointmentType}</p>
                <p className="text-sm text-gray-600">
                  {data.preferredDate} الساعة {data.preferredTime}
                </p>
              </div>
            </div>
            {data.meetingLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {data.meetingLocation}
              </div>
            )}
            {data.notes && (
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{data.notes}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Content */}
      {renderTabContent()}

      {/* Action Buttons */}
      {renderActions()}

      {/* PDF Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحميل PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeOwner"
                checked={includeOwnerInfo}
                onCheckedChange={(checked) => setIncludeOwnerInfo(checked === true)}
              />
              <Label htmlFor="includeOwner">تضمين معلومات المالك/العميل</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeBroker"
                checked={includeBrokerInfo}
                onCheckedChange={(checked) => setIncludeBrokerInfo(checked === true)}
              />
              <Label htmlFor="includeBroker">تضمين معلومات الوسيط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="bg-[#01411C] hover:bg-[#065f41]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog - عرض تفاصيل العرض */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-[#01411C]" />
              تفاصيل العرض العقاري
            </DialogTitle>
          </DialogHeader>
          
          {tab.data && (
            <div className="space-y-6 py-4">
              {/* معلومات المالك */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  معلومات المالك
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">الاسم:</span> <span className="font-medium">{tab.data.ownerName || '-'}</span></div>
                  <div><span className="text-gray-500">الجوال:</span> <span className="font-medium">{tab.data.ownerPhone || '-'}</span></div>
                  {tab.data.ownerIdNumber && (
                    <div><span className="text-gray-500">رقم الهوية:</span> <span className="font-medium">{tab.data.ownerIdNumber}</span></div>
                  )}
                  {tab.data.ownerCity && (
                    <div><span className="text-gray-500">المدينة:</span> <span className="font-medium">{tab.data.ownerCity}</span></div>
                  )}
                </div>
              </div>

              {/* معلومات الصك */}
              {(tab.data.deedNumber || tab.data.deedDate) && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    معلومات الصك
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {tab.data.deedNumber && <div><span className="text-gray-500">رقم الصك:</span> <span className="font-medium">{tab.data.deedNumber}</span></div>}
                    {tab.data.deedDate && <div><span className="text-gray-500">تاريخ الصك:</span> <span className="font-medium">{tab.data.deedDate}</span></div>}
                    {tab.data.deedCity && <div><span className="text-gray-500">مدينة الصك:</span> <span className="font-medium">{tab.data.deedCity}</span></div>}
                  </div>
                </div>
              )}

              {/* معلومات العقار */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  معلومات العقار
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-gray-500">نوع العقار:</span> <span className="font-medium">{tab.data.propertyType || '-'}</span></div>
                  <div><span className="text-gray-500">الغرض:</span> <span className="font-medium">{tab.data.purpose || '-'}</span></div>
                  {tab.data.area && <div><span className="text-gray-500">المساحة:</span> <span className="font-medium">{tab.data.area} م²</span></div>}
                  {tab.data.price && <div><span className="text-gray-500">السعر:</span> <span className="font-medium text-green-600">{Number(tab.data.price).toLocaleString()} ريال</span></div>}
                </div>
              </div>

              {/* قسم موقع العقار */}
              {(tab.data.locationCity || tab.data.locationLat || tab.data.googleMapsUrl) && (
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200">
                  <h4 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    موقع العقار
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                    {tab.data.locationCity && <div><span className="text-gray-500">المدينة:</span> <span className="font-medium">{tab.data.locationCity}</span></div>}
                    {tab.data.locationDistrict && <div><span className="text-gray-500">الحي:</span> <span className="font-medium">{tab.data.locationDistrict}</span></div>}
                    {tab.data.locationStreet && <div><span className="text-gray-500">الشارع:</span> <span className="font-medium">{tab.data.locationStreet}</span></div>}
                    {tab.data.locationBuilding && <div><span className="text-gray-500">رقم المبنى:</span> <span className="font-medium">{tab.data.locationBuilding}</span></div>}
                    {tab.data.locationAdditionalNumber && <div><span className="text-gray-500">الرقم الإضافي:</span> <span className="font-medium">{tab.data.locationAdditionalNumber}</span></div>}
                    {tab.data.locationPostalCode && <div><span className="text-gray-500">الرمز البريدي:</span> <span className="font-medium">{tab.data.locationPostalCode}</span></div>}
                  </div>
                  {tab.data.googleMapsUrl && (
                    <a 
                      href={tab.data.googleMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      فتح في خرائط جوجل
                    </a>
                  )}
                </div>
              )}

              {/* خيارات الدفعات للإيجار */}
              {tab.data.purpose === 'للإيجار' && tab.data.paymentPrices && (
                (tab.data.paymentPrices.onePayment || tab.data.paymentPrices.twoPayments || 
                 tab.data.paymentPrices.fourPayments || tab.data.paymentPrices.monthly) && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    💳 خيارات الدفعات
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tab.data.paymentPrices.onePayment && (
                      <div className="bg-white p-3 rounded-lg text-center border border-amber-200">
                        <span className="block text-gray-500 text-xs mb-1">دفعة واحدة</span>
                        <span className="font-bold text-amber-700">{Number(tab.data.paymentPrices.onePayment).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">ريال</span>
                      </div>
                    )}
                    {tab.data.paymentPrices.twoPayments && (
                      <div className="bg-white p-3 rounded-lg text-center border border-amber-200">
                        <span className="block text-gray-500 text-xs mb-1">دفعتين</span>
                        <span className="font-bold text-amber-700">{Number(tab.data.paymentPrices.twoPayments).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">ريال</span>
                      </div>
                    )}
                    {tab.data.paymentPrices.fourPayments && (
                      <div className="bg-white p-3 rounded-lg text-center border border-amber-200">
                        <span className="block text-gray-500 text-xs mb-1">أربع دفعات</span>
                        <span className="font-bold text-amber-700">{Number(tab.data.paymentPrices.fourPayments).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">ريال</span>
                      </div>
                    )}
                    {tab.data.paymentPrices.monthly && (
                      <div className="bg-white p-3 rounded-lg text-center border border-amber-200">
                        <span className="block text-gray-500 text-xs mb-1">شهري</span>
                        <span className="font-bold text-amber-700">{Number(tab.data.paymentPrices.monthly).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">ريال</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* المواصفات */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3">المواصفات</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {tab.data.bedrooms && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">غرف النوم</span><span className="font-bold text-purple-700">{tab.data.bedrooms}</span></div>}
                  {tab.data.bathrooms && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">دورات المياه</span><span className="font-bold text-purple-700">{tab.data.bathrooms}</span></div>}
                  {tab.data.livingRooms && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">صالات</span><span className="font-bold text-purple-700">{tab.data.livingRooms}</span></div>}
                  {tab.data.floors && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">الأدوار</span><span className="font-bold text-purple-700">{tab.data.floors}</span></div>}
                  {tab.data.propertyAge && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">عمر العقار</span><span className="font-bold text-purple-700">{tab.data.propertyAge} سنة</span></div>}
                  {tab.data.facade && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">الواجهة</span><span className="font-bold text-purple-700">{tab.data.facade}</span></div>}
                  {tab.data.furnishing && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">التأثيث</span><span className="font-bold text-purple-700">{tab.data.furnishing}</span></div>}
                  {tab.data.streetWidth && <div className="bg-white p-2 rounded-lg text-center"><span className="block text-gray-500">عرض الشارع</span><span className="font-bold text-purple-700">{tab.data.streetWidth} م</span></div>}
                </div>
              </div>

              {/* الصور */}
              {tab.data.media && tab.data.media.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3">الصور والوسائط ({tab.data.media.length})</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {tab.data.media.map((m: any, i: number) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        {m.type === 'video' ? (
                          <video src={m.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                        {m.isMain && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">رئيسية</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الوصف */}
              {tab.data.description && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-2">الوصف</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{tab.data.description}</p>
                </div>
              )}

              {/* تاريخ الاستلام */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <Clock className="w-4 h-4 inline-block ml-1" />
                تم الاستلام: {new Date(tab.data.submittedAt || tab.createdAt).toLocaleString('ar-SA')}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
            <Button 
              onClick={handleRepublish}
              className="bg-[#01411C] hover:bg-[#065f41]"
            >
              <Send className="w-4 h-4 ml-2" />
              نشر الإعلان
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}