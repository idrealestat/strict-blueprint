/**
 * generatePropertyPDF.ts
 * دالة توليد ملف PDF لتفاصيل العقار مع دعم كامل للعربية
 * باستخدام html2canvas لدعم النصوص العربية بشكل صحيح
 * تم تحسين الأمان بإضافة DOMPurify لمنع هجمات XSS
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

interface PropertyData {
  id?: string;
  slug?: string;
  propertyType?: string;
  category?: string;
  purpose?: string;
  area?: string;
  price?: string;
  locationDetails?: {
    city?: string;
    district?: string;
    street?: string;
    buildingNumber?: string;
    postalCode?: string;
  };
  bedrooms?: string;
  bathrooms?: string;
  livingRooms?: string;
  floors?: string;
  floorNumber?: string;
  streetWidth?: string;
  propertyAge?: string;
  facade?: string;
  furnishing?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  features?: string[];
  aiDescription?: string;
  brokerPhone?: string;
  adLicense?: string;
  publishedAt?: string;
  images?: string[];
  image?: string;
  title?: string;
  broker?: BrokerData;
  offerUrl?: string;
}

/**
 * تنظيف النص من أي محتوى ضار باستخدام DOMPurify
 * يزيل جميع علامات HTML ويحافظ على النص فقط
 */
const sanitize = (text: string | undefined | null): string => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * تنظيف رقم الهاتف - يسمح فقط بالأرقام والرموز الأساسية
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
  return toArabicNumerals(numPrice.toLocaleString('ar-SA'));
};

/**
 * إنشاء عنصر HTML للطباعة كـ PDF
 */
const createPDFContent = (property: PropertyData, includeOwner: boolean, broker?: BrokerData): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = 'pdf-content';
  // نضعه في موقع مرئي مؤقتاً للسماح بتحميل الخطوط
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

  // تنظيف جميع المدخلات
  const safeArea = sanitize(property.area);
  const safePropertyType = sanitize(property.propertyType) || 'عقار';
  const safeTitle = sanitize(property.title);
  const safeBedrooms = sanitize(property.bedrooms);
  const safeBathrooms = sanitize(property.bathrooms);
  const safeLivingRooms = sanitize(property.livingRooms);
  const safeFloors = sanitize(property.floors);
  const safeFloorNumber = sanitize(property.floorNumber);
  const safeStreetWidth = sanitize(property.streetWidth);
  const safePropertyAge = sanitize(property.propertyAge);
  const safeFacade = sanitize(property.facade);
  const safeFurnishing = sanitize(property.furnishing);
  const safeCity = sanitize(property.locationDetails?.city);
  const safeDistrict = sanitize(property.locationDetails?.district);
  const safeStreet = sanitize(property.locationDetails?.street);
  const safeAiDescription = sanitize(property.aiDescription);
  const safeBrokerPhone = sanitizePhone(property.brokerPhone);
  const safeFeatures = property.features?.map(f => sanitize(f)) || [];

  const purposeAr = property.purpose === 'rent' || property.category === 'للإيجار' ? 'للإيجار' : 'للبيع';
  const typeAr = safePropertyType;
  
  // جميع الصور - تنظيف URLs
  const allImages = property.images && property.images.length > 0 
    ? property.images.map(img => encodeURI(img))
    : (property.image ? [encodeURI(property.image)] : []);

  // معلومات الوسيط
  const brokerData = broker || property.broker;
  const safeBrokerName = sanitize(brokerData?.name);
  const safeBrokerCompany = sanitize(brokerData?.company);
  const safeBrokerLocation = sanitize(brokerData?.location);
  const safeBrokerLicense = sanitize(brokerData?.licenseNumber);
  const brokerProfileImage = brokerData?.profileImage ? encodeURI(brokerData.profileImage) : null;
  const brokerCoverImage = brokerData?.coverImage ? encodeURI(brokerData.coverImage) : null;
  const brokerLogoImage = brokerData?.logoImage ? encodeURI(brokerData.logoImage) : null;
  const offerUrl = property.offerUrl || '';

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
      * { font-family: 'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important; }
      .no-break { page-break-inside: avoid; break-inside: avoid; }
    </style>
    
    <!-- رأس الصفحة مع معلومات الوسيط -->
    <div style="position: relative; min-height: 120px; overflow: hidden;">
      <!-- صورة الغلاف -->
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
        <!-- صورة البروفايل -->
        <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(212,175,55,0.2); border: 3px solid #D4AF37; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
          ${brokerProfileImage ? `
          <img src="${brokerProfileImage}" alt="${safeBrokerName}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
          ` : `
          <div style="font-size: 28px; color: #D4AF37;">🏢</div>
          `}
        </div>
        
        <!-- معلومات الوسيط -->
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
        
        <!-- صورة الشعار -->
        ${brokerLogoImage ? `
        <div style="width: 55px; height: 55px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
          <img src="${brokerLogoImage}" alt="شعار" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;" crossorigin="anonymous" />
        </div>
        ` : ''}
      </div>
    </div>

    <!-- شريط عنوان العرض -->
    <div style="background: #D4AF37; padding: 12px; text-align: center;">
      <h2 style="color: #01411C; font-size: 18px; font-weight: bold; margin: 0;">
        عرض ${purposeAr} - ${typeAr} - ${safeArea || ''}م²
      </h2>
      ${safeTitle ? `<p style="color: #01411C; font-size: 12px; margin: 5px 0 0 0; opacity: 0.8;">${safeTitle}</p>` : ''}
      ${property.adLicense ? `<p style="color: #01411C; font-size: 11px; margin: 5px 0 0 0; opacity: 0.7;">📋 رقم الترخيص الإعلاني: ${sanitize(property.adLicense)}</p>` : ''}
    </div>

    <!-- جميع صور العقار -->
    ${allImages.length > 0 ? `
    <div style="padding: 15px;">
      <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
        📷 صور العقار (${toArabicNumerals(allImages.length)} صورة)
      </h3>
      
      <!-- الصورة الرئيسية بحجم كامل -->
      <div style="margin-bottom: 10px; background: #f8f9fa; padding: 8px; border-radius: 12px;">
        <img src="${allImages[0]}" alt="الصورة الرئيسية" style="width: 100%; max-height: 280px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.12); object-fit: contain;" crossorigin="anonymous" />
      </div>
      
      <!-- بقية الصور في شبكة 3x3 -->
      ${allImages.length > 1 ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
        ${allImages.slice(1).map((img, index) => `
          <img src="${img}" alt="صورة ${index + 2}" style="width: 100%; height: 100px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); object-fit: cover;" crossorigin="anonymous" />
        `).join('')}
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- المعلومات الرئيسية -->
    <div style="padding: 15px;">
      
      <!-- السعر - في الأعلى لتجنب القطع -->
      <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 10px 20px; border-radius: 10px; text-align: center; margin-bottom: 15px; display: inline-block; width: auto; margin-left: auto; margin-right: auto;">
        <span style="color: #D4AF37; font-size: 22px; font-weight: bold;">${property.price ? formatArabicPrice(property.price) : '-'}</span>
        <span style="color: #fff; font-size: 12px; margin-right: 8px;">ريال سعودي ${property.purpose === 'rent' ? 'سنوياً' : ''}</span>
      </div>
      
      <!-- بطاقات المعلومات الأساسية -->
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${safeArea ? toArabicNumerals(safeArea) : '-'}</div>
          <div style="color: #666; font-size: 11px;">م² المساحة</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${safeBedrooms ? toArabicNumerals(safeBedrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">غرف</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${safeBathrooms ? toArabicNumerals(safeBathrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">حمامات</div>
        </div>
      </div>

      <!-- قسم الموقع -->
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📍 الموقع والعنوان
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">المدينة:</td>
            <td style="padding: 6px; background: #fff;">${safeCity || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الحي:</td>
            <td style="padding: 6px; background: #fff;">${safeDistrict || '-'}</td>
          </tr>
          ${safeStreet ? `
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الشارع:</td>
            <td colspan="3" style="padding: 6px; background: #fff;">${safeStreet}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- قسم المواصفات -->
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          🏠 المواصفات التفصيلية
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            ${safeBedrooms ? `<td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">غرف النوم:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeBedrooms)} غرف</td>` : '<td></td><td></td>'}
            ${safeBathrooms ? `<td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">دورات المياه:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeBathrooms)} حمام</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${safeLivingRooms ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الصالات:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeLivingRooms)} صالة</td>` : '<td></td><td></td>'}
            ${safeFloors ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عدد الأدوار:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeFloors)} دور</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${safeFloorNumber ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">رقم الطابق:</td><td style="padding: 6px; background: #fff;">الطابق ${toArabicNumerals(safeFloorNumber)}</td>` : '<td></td><td></td>'}
            ${safeStreetWidth ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عرض الشارع:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safeStreetWidth)} متر</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${safePropertyAge ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عمر العقار:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(safePropertyAge)} سنة</td>` : '<td></td><td></td>'}
            ${safeFacade ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الواجهة:</td><td style="padding: 6px; background: #fff;">${safeFacade}</td>` : '<td></td><td></td>'}
          </tr>
          ${safeFurnishing ? `
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">التأثيث:</td>
            <td colspan="3" style="padding: 6px; background: #fff;">${safeFurnishing}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- المميزات -->
      ${safeFeatures.length > 0 ? `
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          ✨ المميزات الإضافية
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${safeFeatures.map(f => `
            <span style="background: #f0f7f2; color: #01411C; padding: 5px 10px; border-radius: 15px; font-size: 11px; border: 1px solid #D4AF37;">
              ✓ ${f}
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- الوصف الكامل -->
      ${safeAiDescription ? `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📝 وصف العقار
        </h3>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; color: #333; font-size: 12px; line-height: 1.8; text-align: justify; white-space: pre-wrap;">
          ${safeAiDescription}
        </div>
      </div>
      ` : ''}

      <!-- معلومات التواصل (الوسيط فقط) -->
      ${safeBrokerPhone ? `
      <div class="no-break" style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📞 معلومات التواصل
        </h3>
        <div style="background: linear-gradient(135deg, #f0f7f2 0%, #e8f5e9 100%); padding: 15px; border-radius: 10px; border: 1px solid #D4AF37;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #01411C;">🏢 الوسيط العقاري:</td>
              <td style="padding: 8px 0; color: #333; direction: ltr; text-align: right;">${safeBrokerPhone}</td>
            </tr>
          </table>
          
          <!-- أزرار التواصل -->
          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 15px; flex-wrap: wrap;">
            <div style="background: #25D366; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              💬 واتساب: ${safeBrokerPhone}
            </div>
            <div style="background: #01411C; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              📞 اتصال: ${safeBrokerPhone}
            </div>
          </div>
          
          <!-- رابط العرض -->
          ${offerUrl ? `
          <div style="margin-top: 15px; text-align: center; padding: 12px; background: rgba(1,65,28,0.1); border-radius: 10px; border: 1px dashed #D4AF37;">
            <div style="color: #01411C; font-size: 11px; margin-bottom: 5px;">🔗 رابط العرض على المنصة:</div>
            <a href="${offerUrl}" style="color: #01411C; font-size: 12px; font-weight: bold; word-break: break-all; text-decoration: underline;">${offerUrl}</a>
          </div>
          ` : ''}
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
 * توليد PDF لتفاصيل العقار مع دعم العربية الكامل
 */
export async function generatePropertyPDF(property: PropertyData, includeOwner: boolean = true, broker?: BrokerData): Promise<void> {
  // إنشاء محتوى HTML
  const container = createPDFContent(property, includeOwner, broker);
  document.body.appendChild(container);

  // إضافة خط عربي ديناميكياً (نفس خط التطبيق)
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  // انتظار تحميل الخطوط والصور
  await new Promise(resolve => setTimeout(resolve, 1000));

  // انتظار تحميل الصور
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

  // انتظار إضافي للخطوط
  await document.fonts.ready;

  try {
    // تحويل HTML إلى Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // التأكد من تطبيق الخطوط على العنصر المنسوخ
        const clonedContainer = clonedDoc.getElementById('pdf-content');
        if (clonedContainer) {
          clonedContainer.style.fontFamily = "'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Arial, sans-serif";
        }
      }
    });

    // إنشاء PDF من Canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // إذا كان المحتوى أطول من صفحة واحدة
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
    
    // إضافة رابط قابل للنقر في أسفل آخر صفحة
    const offerUrl = property.offerUrl;
    if (offerUrl) {
      const lastPage = pdf.getNumberOfPages();
      pdf.setPage(lastPage);
      
      // إضافة مستطيل خلفية للرابط (أزرق فاتح)
      pdf.setFillColor(230, 240, 255);
      pdf.roundedRect(15, 268, 180, 18, 3, 3, 'F');
      
      // إضافة حدود زرقاء
      pdf.setDrawColor(0, 100, 200);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, 268, 180, 18, 3, 3, 'S');
      
      // إضافة نص الرابط باللون الأزرق
      pdf.setTextColor(0, 80, 180);
      pdf.setFontSize(8);
      const displayUrl = offerUrl.length > 60 ? offerUrl.substring(0, 60) + '...' : offerUrl;
      pdf.text(displayUrl, 105, 279, { align: 'center' });
      
      // إضافة منطقة الرابط القابلة للنقر فوق المستطيل بالكامل
      pdf.link(15, 268, 180, 18, { url: offerUrl });
    }

    // اسم الملف بالعربية
    const purposeAr = property.purpose === 'rent' || property.category === 'للإيجار' ? 'للإيجار' : 'للبيع';
    const typeAr = property.propertyType || 'عقار';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `عرض_${purposeAr}_-_${typeAr}_-_${property.area || ''}م_${date}.pdf`;
    
    pdf.save(fileName);
  } finally {
    // تنظيف العناصر المؤقتة
    document.body.removeChild(container);
    document.head.removeChild(fontLink);
  }
}
