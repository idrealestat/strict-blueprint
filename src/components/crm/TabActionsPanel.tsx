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
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { generatePropertyPDF } from '@/utils/generatePropertyPDF';
import { generateRequestPDF } from '@/utils/generateRequestPDF';

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
  location?: string;
  profileImage?: string;
  coverImage?: string;
  logoImage?: string;
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

  // Generate PDF using the rich PDF generators with broker header
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const data = tab.data;
      
      // إعداد بيانات الوسيط للهيدر (مع الصور)
      const brokerData = brokerInfo ? {
        name: brokerInfo.name,
        company: brokerInfo.company,
        phone: brokerInfo.phone,
        location: brokerInfo.location || '',
        licenseNumber: brokerInfo.licenseNumber,
        profileImage: brokerInfo.profileImage,
        coverImage: brokerInfo.coverImage,
        logoImage: brokerInfo.logoImage,
      } : undefined;
      
      if (tab.type === 'property_offer' || tab.type === 'published_ad') {
        // استخدام generatePropertyPDF مع الهيدر الكامل
        await generatePropertyPDF(
          {
            id: data.id || tab.id,
            title: data.title || `عرض عقاري - ${data.propertyType || ''}`,
            propertyType: data.propertyType,
            category: data.purpose || data.category || 'للبيع',
            purpose: data.purpose,
            area: data.area?.toString(),
            price: data.price?.toString(),
            locationDetails: {
              city: data.city || data.locationCity || '',
              district: data.district || data.locationDistrict || '',
              street: data.street || data.locationStreet || '',
            },
            bedrooms: data.bedrooms?.toString(),
            bathrooms: data.bathrooms?.toString(),
            livingRooms: data.livingRooms,
            councils: data.councils,
            floors: data.floors,
            floorNumber: data.floorNumber,
            streetWidth: data.streetWidth,
            propertyAge: data.propertyAge,
            facade: data.facade,
            furnishing: data.furnishing,
            entrances: data.entrances,
            warehouses: data.warehouses,
            balconies: data.balconies,
            acUnits: data.acUnits,
            ownerName: includeOwnerInfo ? (data.ownerName || customerName) : undefined,
            ownerPhone: includeOwnerInfo ? (data.ownerPhone || customerPhone) : undefined,
            ownerIdNumber: includeOwnerInfo ? data.ownerIdNumber : undefined,
            ownerBirthDate: includeOwnerInfo ? data.ownerBirthDate : undefined,
            ownerCity: includeOwnerInfo ? data.ownerCity : undefined,
            ownerDistrict: includeOwnerInfo ? data.ownerDistrict : undefined,
            deedNumber: includeOwnerInfo ? data.deedNumber : undefined,
            deedDate: includeOwnerInfo ? data.deedDate : undefined,
            deedCity: includeOwnerInfo ? data.deedCity : undefined,
            brokerPhone: brokerInfo?.phone,
            adLicense: data.adLicense,
            aiDescription: data.description || data.aiDescription,
            features: data.features || data.customFeatures?.split(',').map((f: string) => f.trim()).filter(Boolean),
            warranties: data.warranties,
            tour3dUrl: data.tour3dUrl || data.tour3DUrl,
            images: data.media?.filter((m: any) => m.type === 'image').map((m: any) => m.url) || data.images,
            image: data.image || data.media?.[0]?.url,
          },
          includeOwnerInfo,
          brokerData
        );
      } else if (tab.type === 'property_request') {
        // استخدام generateRequestPDF مع الهيدر الكامل
        await generateRequestPDF(
          {
            id: data.id || tab.id,
            ownerName: includeOwnerInfo ? (data.clientName || data.ownerName || customerName) : undefined,
            ownerPhone: includeOwnerInfo ? (data.clientPhone || data.ownerPhone || customerPhone) : undefined,
            ownerIdNumber: includeOwnerInfo ? (data.clientIdNumber || data.ownerIdNumber) : undefined,
            ownerBirthDate: includeOwnerInfo ? data.ownerBirthDate : undefined,
            ownerCity: includeOwnerInfo ? data.ownerCity : undefined,
            ownerDistrict: includeOwnerInfo ? data.ownerDistrict : undefined,
            propertyType: data.propertyType,
            purpose: data.purpose,
            preferredCity: data.preferredCity,
            preferredDistricts: Array.isArray(data.preferredDistricts) ? data.preferredDistricts.join('، ') : data.preferredDistricts,
            minArea: data.minArea,
            maxArea: data.maxArea,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            livingRooms: data.livingRooms,
            floors: data.floors,
            furnishing: data.furnishing,
            minBudget: data.minBudget,
            maxBudget: data.maxBudget,
            paymentPrices: data.paymentPrices,
            hasPool: data.hasPool,
            hasGarden: data.hasGarden,
            hasElevator: data.hasElevator,
            hasParking: data.hasParking,
            hasMaidRoom: data.hasMaidRoom,
            hasDriverRoom: data.hasDriverRoom,
            additionalRequirements: data.additionalRequirements,
            urgency: data.urgency,
            createdAt: tab.createdAt,
          },
          includeOwnerInfo,
          brokerData
        );
      } else {
        // للأنواع الأخرى (price_quote, appointment) - استخدام HTML مع هيدر الوسيط
        await generateGenericPDFWithHeader(data, brokerData);
      }
      
      toast.success('تم تحميل PDF بنجاح');
      setShowPdfDialog(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // دالة إنشاء PDF للأنواع الأخرى (عرض سعر، موعد) مع هيدر الوسيط
  const generateGenericPDFWithHeader = async (data: any, brokerData?: any) => {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 595px;
      min-height: 842px;
      padding: 0;
      margin: 0;
      font-family: 'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      background: white;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 99999;
      overflow: hidden;
    `;

    const brokerProfileImage = brokerData?.profileImage ? encodeURI(brokerData.profileImage) : null;
    const brokerCoverImage = brokerData?.coverImage ? encodeURI(brokerData.coverImage) : null;
    const brokerLogoImage = brokerData?.logoImage ? encodeURI(brokerData.logoImage) : null;
    const safeBrokerName = brokerData?.name || 'الوسيط العقاري';
    const safeBrokerCompany = brokerData?.company || '';
    const safeBrokerPhone = brokerData?.phone || '';
    const safeBrokerLocation = brokerData?.location || '';
    const safeBrokerLicense = brokerData?.licenseNumber || '';

    const title = tab.type === 'price_quote' ? 'عرض سعر' : tab.type === 'appointment' ? 'تفاصيل الموعد' : 'تفاصيل';

    let contentHtml = '';

    if (tab.type === 'price_quote') {
      contentHtml = `
        <div style="padding: 15px;">
          <div class="no-break" style="margin-bottom: 15px;">
            <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">💰 تفاصيل عرض السعر</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              ${data.quoteType ? `<tr><td style="padding: 6px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">نوع الخدمة:</td><td style="padding: 6px; background: #fff;">${data.quoteType}</td></tr>` : ''}
              ${data.budget ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الميزانية:</td><td style="padding: 6px; background: #fff;">${Number(data.budget).toLocaleString()} ريال</td></tr>` : ''}
              ${data.propertyType ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">نوع العقار:</td><td style="padding: 6px; background: #fff;">${data.propertyType}</td></tr>` : ''}
              ${data.city ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">المدينة:</td><td style="padding: 6px; background: #fff;">${data.city}</td></tr>` : ''}
              ${data.district ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الحي:</td><td style="padding: 6px; background: #fff;">${data.district}</td></tr>` : ''}
              ${data.notes ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">ملاحظات:</td><td style="padding: 6px; background: #fff;">${data.notes}</td></tr>` : ''}
            </table>
          </div>
          ${includeOwnerInfo ? `
          <div class="no-break" style="margin-bottom: 15px;">
            <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">👤 معلومات العميل</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr><td style="padding: 6px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">الاسم:</td><td style="padding: 6px; background: #fff;">${data.clientName || customerName || '-'}</td></tr>
              <tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الجوال:</td><td style="padding: 6px; background: #fff; direction: ltr; text-align: right;">${data.clientPhone || customerPhone || '-'}</td></tr>
            </table>
          </div>
          ` : ''}
        </div>
      `;
    } else if (tab.type === 'appointment') {
      contentHtml = `
        <div style="padding: 15px;">
          <div class="no-break" style="margin-bottom: 15px;">
            <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">📅 تفاصيل الموعد</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              ${data.appointmentType ? `<tr><td style="padding: 6px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">نوع الموعد:</td><td style="padding: 6px; background: #fff;">${data.appointmentType}</td></tr>` : ''}
              ${data.preferredDate ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">التاريخ:</td><td style="padding: 6px; background: #fff;">${data.preferredDate}</td></tr>` : ''}
              ${data.preferredTime ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الوقت:</td><td style="padding: 6px; background: #fff;">${data.preferredTime}</td></tr>` : ''}
              ${data.meetingLocation ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">المكان:</td><td style="padding: 6px; background: #fff;">${data.meetingLocation}</td></tr>` : ''}
              ${data.propertyTitle ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">العقار:</td><td style="padding: 6px; background: #fff;">${data.propertyTitle}</td></tr>` : ''}
              ${data.notes ? `<tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">ملاحظات:</td><td style="padding: 6px; background: #fff;">${data.notes}</td></tr>` : ''}
            </table>
          </div>
          ${includeOwnerInfo ? `
          <div class="no-break" style="margin-bottom: 15px;">
            <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">👤 معلومات العميل</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr><td style="padding: 6px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">الاسم:</td><td style="padding: 6px; background: #fff;">${data.clientName || customerName || '-'}</td></tr>
              <tr><td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الجوال:</td><td style="padding: 6px; background: #fff; direction: ltr; text-align: right;">${data.clientPhone || customerPhone || '-'}</td></tr>
            </table>
          </div>
          ` : ''}
        </div>
      `;
    }

    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
        * { font-family: 'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important; }
        .no-break { page-break-inside: avoid; break-inside: avoid; }
      </style>
      
      <!-- رأس الصفحة مع معلومات الوسيط -->
      <div style="position: relative; min-height: 120px; overflow: hidden;">
        ${brokerCoverImage ? `
        <div style="position: absolute; inset: 0;">
          <img src="${brokerCoverImage}" alt="غلاف" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
          <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(1,65,28,0.7), rgba(1,65,28,0.6), rgba(1,65,28,0.9));"></div>
        </div>
        ` : `
        <div style="position: absolute; inset: 0; background: linear-gradient(135deg, #01411C 0%, #065f41 100%);"></div>
        `}
        
        <div style="position: relative; padding: 20px; display: flex; align-items: center; gap: 15px;">
          <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(212,175,55,0.2); border: 3px solid #D4AF37; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
            ${brokerProfileImage ? `
            <img src="${brokerProfileImage}" alt="${safeBrokerName}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
            ` : `
            <div style="font-size: 28px; color: #D4AF37;">🏢</div>
            `}
          </div>
          
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h1 style="color: white; font-size: 20px; font-weight: bold; margin: 0;">${safeBrokerName}</h1>
              <span style="background: #D4AF37; color: #01411C; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">✓ موثق</span>
            </div>
            ${safeBrokerCompany ? `<p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0 0;">${safeBrokerCompany}</p>` : ''}
            <div style="display: flex; align-items: center; gap: 15px; margin-top: 6px; flex-wrap: wrap;">
              ${safeBrokerPhone ? `<span style="color: rgba(255,255,255,0.7); font-size: 11px;">📞 ${safeBrokerPhone}</span>` : ''}
              ${safeBrokerLocation ? `<span style="color: rgba(255,255,255,0.7); font-size: 11px;">📍 ${safeBrokerLocation}</span>` : ''}
            </div>
            ${safeBrokerLicense ? `
            <div style="margin-top: 6px; color: rgba(255,255,255,0.6); font-size: 10px;">
              🏆 رخصة فال: ${safeBrokerLicense}
            </div>
            ` : ''}
          </div>
          
          ${brokerLogoImage ? `
          <div style="width: 55px; height: 55px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
            <img src="${brokerLogoImage}" alt="شعار" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;" crossorigin="anonymous" />
          </div>
          ` : ''}
        </div>
      </div>

      <!-- شريط العنوان -->
      <div style="background: #D4AF37; padding: 12px; text-align: center;">
        <h2 style="color: #01411C; font-size: 18px; font-weight: bold; margin: 0;">${title}</h2>
        <p style="color: #01411C; font-size: 11px; margin: 5px 0 0 0; opacity: 0.7;">
          التاريخ: ${new Date(tab.createdAt).toLocaleDateString('ar-SA')}
        </p>
      </div>

      ${contentHtml}

      <!-- تذييل الصفحة -->
      <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 12px 20px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.6); font-size: 9px;">
          <span>${safeBrokerName} ${safeBrokerCompany ? `| ${safeBrokerCompany}` : ''}</span>
          <span>مدعوم من وساطة AI</span>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // انتظار تحميل الخطوط والصور
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${title}_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } finally {
      document.body.removeChild(container);
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