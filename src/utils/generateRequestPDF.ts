/**
 * generateRequestPDF.ts
 * دالة توليد ملف PDF لتفاصيل طلب العقار
 * بنفس تصميم PDF العروض مع دعم كامل للعربية
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';

interface BrokerData {
  name?: string;
  company?: string;
  phone?: string;
  location?: string;
  licenseNumber?: string;
  profileImage?: string;
  coverImage?: string;
  logoImage?: string;
}

interface RequestData {
  id?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerIdNumber?: string;
  ownerBirthDate?: string;
  ownerCity?: string;
  ownerDistrict?: string;
  propertyType?: string;
  purpose?: string;
  preferredCity?: string;
  preferredDistricts?: string;
  minArea?: string;
  maxArea?: string;
  bedrooms?: string;
  bathrooms?: string;
  livingRooms?: string;
  floors?: string;
  furnishing?: string;
  minBudget?: string;
  maxBudget?: string;
  paymentPrices?: {
    onePayment?: string;
    twoPayments?: string;
    fourPayments?: string;
    monthly?: string;
  };
  hasPool?: boolean;
  hasGarden?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasMaidRoom?: boolean;
  hasDriverRoom?: boolean;
  additionalRequirements?: string;
  urgency?: string;
  createdAt?: string;
}

/**
 * تنظيف النص من أي محتوى ضار
 */
const sanitize = (text: string | undefined | null): string => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * تنظيف رقم الهاتف
 */
const sanitizePhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  return phone.replace(/[^\d+\-\s()]/g, '');
};

// تحويل الأرقام إلى أرقام عربية
const toArabicNumerals = (num: string | number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicNumbers[parseInt(d)]);
};

// تنسيق السعر بالعربية
const formatArabicPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  if (isNaN(numPrice)) return '-';
  return toArabicNumerals(numPrice.toLocaleString('ar-SA'));
};

/**
 * إنشاء عنصر HTML للطباعة كـ PDF
 */
const createRequestPDFContent = (request: RequestData, includeOwner: boolean, broker?: BrokerData): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = 'pdf-request-content';
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

  // تنظيف البيانات
  const safeBrokerName = sanitize(broker?.name);
  const safeBrokerCompany = sanitize(broker?.company);
  const safeBrokerPhone = sanitizePhone(broker?.phone);
  const safeBrokerLocation = sanitize(broker?.location);
  const safeBrokerLicense = sanitize(broker?.licenseNumber);
  const brokerProfileImage = broker?.profileImage ? encodeURI(broker.profileImage) : null;
  const brokerCoverImage = broker?.coverImage ? encodeURI(broker.coverImage) : null;
  const brokerLogoImage = broker?.logoImage ? encodeURI(broker.logoImage) : null;

  const safeOwnerName = sanitize(request.ownerName);
  const safeOwnerPhone = sanitizePhone(request.ownerPhone);
  const safeOwnerIdNumber = sanitize(request.ownerIdNumber);
  const safeOwnerBirthDate = sanitize(request.ownerBirthDate);
  const safeOwnerCity = sanitize(request.ownerCity);
  const safeOwnerDistrict = sanitize(request.ownerDistrict);
  const safePropertyType = sanitize(request.propertyType) || 'عقار';
  const safePurpose = sanitize(request.purpose) || 'للشراء';
  const safePreferredCity = sanitize(request.preferredCity);
  const safePreferredDistricts = sanitize(request.preferredDistricts);
  const safeMinArea = sanitize(request.minArea);
  const safeMaxArea = sanitize(request.maxArea);
  const safeBedrooms = sanitize(request.bedrooms);
  const safeBathrooms = sanitize(request.bathrooms);
  const safeLivingRooms = sanitize(request.livingRooms);
  const safeFloors = sanitize(request.floors);
  const safeFurnishing = sanitize(request.furnishing);
  const safeMinBudget = sanitize(request.minBudget);
  const safeMaxBudget = sanitize(request.maxBudget);
  const safeAdditionalReq = sanitize(request.additionalRequirements);

  // الميزات المطلوبة
  const features: string[] = [];
  if (request.hasPool) features.push('مسبح');
  if (request.hasGarden) features.push('حديقة');
  if (request.hasElevator) features.push('مصعد');
  if (request.hasParking) features.push('موقف سيارات');
  if (request.hasMaidRoom) features.push('غرفة خادمة');
  if (request.hasDriverRoom) features.push('غرفة سائق');

  const urgencyLabels: Record<string, string> = {
    urgent: '🔴 عاجل جداً',
    high: '🟠 عاجل',
    normal: '🟢 عادي',
    low: '🔵 غير مستعجل',
  };

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
      
      <!-- محتوى الهيدر -->
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
            <h1 style="color: white; font-size: 20px; font-weight: bold; margin: 0;">${safeBrokerName || 'الوسيط العقاري'}</h1>
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

    <!-- شريط عنوان الطلب -->
    <div style="background: #D4AF37; padding: 12px; text-align: center;">
      <h2 style="color: #01411C; font-size: 18px; font-weight: bold; margin: 0;">
        🔍 طلب ${safePurpose} - ${safePropertyType}
      </h2>
      <p style="color: #01411C; font-size: 11px; margin: 5px 0 0 0; opacity: 0.7;">
        ${request.urgency ? urgencyLabels[request.urgency] || 'عادي' : 'عادي'}
      </p>
    </div>

    <!-- المعلومات الرئيسية -->
    <div style="padding: 15px;">
      
      <!-- الميزانية -->
      <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 10px 20px; border-radius: 10px; text-align: center; margin-bottom: 15px;">
        <span style="color: rgba(255,255,255,0.7); font-size: 12px;">الميزانية: </span>
        <span style="color: #D4AF37; font-size: 20px; font-weight: bold;">
          ${safeMinBudget ? formatArabicPrice(safeMinBudget) : '-'} - ${safeMaxBudget ? formatArabicPrice(safeMaxBudget) : '-'}
        </span>
        <span style="color: #fff; font-size: 12px; margin-right: 8px;">ريال سعودي</span>
      </div>
      
      <!-- بطاقات المواصفات المطلوبة -->
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 18px; font-weight: bold;">
            ${safeMinArea ? toArabicNumerals(safeMinArea) : '-'} - ${safeMaxArea ? toArabicNumerals(safeMaxArea) : '-'}
          </div>
          <div style="color: #666; font-size: 11px;">م² المساحة المطلوبة</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${safeBedrooms ? toArabicNumerals(safeBedrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">غرف نوم</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${safeBathrooms ? toArabicNumerals(safeBathrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">حمامات</div>
        </div>
      </div>

      <!-- قسم الموقع المفضل -->
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📍 الموقع المفضل
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">المدينة:</td>
            <td style="padding: 6px; background: #fff;">${safePreferredCity || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الأحياء:</td>
            <td style="padding: 6px; background: #fff;">${safePreferredDistricts || '-'}</td>
          </tr>
        </table>
      </div>

      <!-- قسم المواصفات -->
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          🏠 المواصفات المطلوبة
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">نوع العقار:</td>
            <td style="padding: 6px; background: #fff;">${safePropertyType}</td>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الغرض:</td>
            <td style="padding: 6px; background: #fff;">${safePurpose}</td>
          </tr>
          <tr>
            ${safeLivingRooms ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الصالات:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeLivingRooms)} صالة</td>` : '<td></td><td></td>'}
            ${safeFloors ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عدد الأدوار:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeFloors)} دور</td>` : '<td></td><td></td>'}
          </tr>
          ${safeFurnishing ? `
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">التأثيث:</td>
            <td colspan="3" style="padding: 6px; background: #fff;">${safeFurnishing}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- الميزات المطلوبة -->
      ${features.length > 0 ? `
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          ✨ الميزات المطلوبة
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${features.map(f => `
            <span style="background: #f0f7f2; color: #01411C; padding: 5px 10px; border-radius: 15px; font-size: 11px; border: 1px solid #D4AF37;">
              ✓ ${f}
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- المتطلبات الإضافية -->
      ${safeAdditionalReq ? `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📝 متطلبات إضافية
        </h3>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; color: #333; font-size: 12px; line-height: 1.8; text-align: justify; white-space: pre-wrap;">
          ${safeAdditionalReq}
        </div>
      </div>
      ` : ''}

      <!-- معلومات المالك/العميل -->
      ${includeOwner ? `
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          👤 معلومات العميل
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الاسم:</td>
            <td style="padding: 6px; background: #fff;">${safeOwnerName || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الجوال:</td>
            <td style="padding: 6px; background: #fff; direction: ltr; text-align: right;">${safeOwnerPhone || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">رقم الهوية:</td>
            <td style="padding: 6px; background: #fff;">${safeOwnerIdNumber || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">تاريخ الميلاد:</td>
            <td style="padding: 6px; background: #fff;">${safeOwnerBirthDate || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">المدينة:</td>
            <td style="padding: 6px; background: #fff;">${safeOwnerCity || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الحي:</td>
            <td style="padding: 6px; background: #fff;">${safeOwnerDistrict || '-'}</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- معلومات التواصل مع الوسيط -->
      ${safeBrokerPhone ? `
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📞 للتواصل
        </h3>
        <div style="background: linear-gradient(135deg, #f0f7f2 0%, #e8f5e9 100%); padding: 15px; border-radius: 10px; border: 1px solid #D4AF37;">
          <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
            <div style="background: #25D366; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              💬 واتساب: ${safeBrokerPhone}
            </div>
            <div style="background: #01411C; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              📞 اتصال: ${safeBrokerPhone}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

    </div>

    <!-- تذييل الصفحة -->
    <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 12px 20px; margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.6); font-size: 9px;">
        <span>📅 تم إنشاءه بتاريخ: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>منصة وساطة العقارية | Wasata Platform</span>
      </div>
    </div>
  `;

  return container;
};

/**
 * توليد PDF لتفاصيل الطلب
 */
export async function generateRequestPDF(request: RequestData, includeOwner: boolean = true, broker?: BrokerData): Promise<void> {
  const container = createRequestPDFContent(request, includeOwner, broker);
  document.body.appendChild(container);

  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  await new Promise(resolve => setTimeout(resolve, 1000));

  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        })
    )
  );

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.getElementById('pdf-request-content');
        if (clonedContainer) {
          clonedContainer.style.fontFamily = "'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Arial, sans-serif";
        }
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = -pageHeight * (Math.ceil((imgHeight - heightLeft) / pageHeight));
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
    
    const purposeAr = request.purpose || 'للشراء';
    const typeAr = request.propertyType || 'عقار';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `طلب_${purposeAr}_-_${typeAr}_${date}.pdf`;
    
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
    document.head.removeChild(fontLink);
  }
}
