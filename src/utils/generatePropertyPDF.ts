/**
 * generatePropertyPDF.ts
 * دالة توليد ملف PDF لتفاصيل العقار مع دعم كامل للعربية
 * باستخدام html2canvas لدعم النصوص العربية بشكل صحيح
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PropertyData {
  id?: string;
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
}

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
const createPDFContent = (property: PropertyData, includeOwner: boolean): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = 'pdf-content';
  // نضعه في موقع مرئي مؤقتاً للسماح بتحميل الخطوط
  container.style.cssText = `
    width: 595px;
    min-height: 842px;
    padding: 0;
    margin: 0;
    font-family: 'Tajawal', 'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    background: white;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99999;
    overflow: hidden;
  `;

  const purposeAr = property.purpose === 'rent' || property.category === 'للإيجار' ? 'للإيجار' : 'للبيع';
  const typeAr = property.propertyType || 'عقار';
  
  // الصورة الرئيسية
  const mainImage = property.image || (property.images && property.images.length > 0 ? property.images[0] : null);

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
      * { font-family: 'Tajawal', 'Cairo', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important; }
    </style>
    
    <!-- رأس الصفحة -->
    <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 20px; text-align: center;">
      <h1 style="color: #D4AF37; font-size: 26px; margin: 0 0 5px 0; font-weight: bold;">منصة وساطة العقارية</h1>
      <p style="color: #ffffff; font-size: 12px; margin: 0;">Wasata Real Estate Platform</p>
    </div>

    <!-- عنوان العرض -->
    <div style="background: #f8f9fa; padding: 15px; text-align: center; border-bottom: 3px solid #D4AF37;">
      <h2 style="color: #01411C; font-size: 20px; margin: 0;">
        عرض ${purposeAr} - ${typeAr} - ${property.area || ''}م²
      </h2>
      ${property.title ? `<p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">${property.title}</p>` : ''}
    </div>

    <!-- الصورة الرئيسية للعقار -->
    ${mainImage ? `
    <div style="padding: 15px; text-align: center;">
      <img src="${mainImage}" alt="صورة العقار" style="max-width: 100%; max-height: 200px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: cover;" crossorigin="anonymous" />
    </div>
    ` : ''}

    <!-- المعلومات الرئيسية -->
    <div style="padding: 15px;">
      
      <!-- بطاقات المعلومات الأساسية -->
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${property.area ? toArabicNumerals(property.area) : '-'}</div>
          <div style="color: #666; font-size: 11px;">م² المساحة</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${property.bedrooms ? toArabicNumerals(property.bedrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">غرف</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f0f7f2; border-radius: 10px; min-width: 100px; margin: 5px;">
          <div style="color: #01411C; font-size: 22px; font-weight: bold;">${property.bathrooms ? toArabicNumerals(property.bathrooms) : '-'}</div>
          <div style="color: #666; font-size: 11px;">حمامات</div>
        </div>
      </div>

      <!-- السعر -->
      <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <div style="color: #D4AF37; font-size: 28px; font-weight: bold;">${property.price ? formatArabicPrice(property.price) : '-'}</div>
        <div style="color: #fff; font-size: 13px;">ريال سعودي ${property.purpose === 'rent' ? 'سنوياً' : ''}</div>
      </div>

      <!-- قسم الموقع -->
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📍 الموقع والعنوان
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">المدينة:</td>
            <td style="padding: 6px; background: #fff;">${property.locationDetails?.city || '-'}</td>
            <td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">الحي:</td>
            <td style="padding: 6px; background: #fff;">${property.locationDetails?.district || '-'}</td>
          </tr>
          ${property.locationDetails?.street ? `
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الشارع:</td>
            <td colspan="3" style="padding: 6px; background: #fff;">${property.locationDetails.street}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- قسم المواصفات -->
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          🏠 المواصفات التفصيلية
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            ${property.bedrooms ? `<td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">غرف النوم:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.bedrooms)} غرف</td>` : '<td></td><td></td>'}
            ${property.bathrooms ? `<td style="padding: 6px; background: #f8f9fa; width: 25%; font-weight: bold; color: #01411C;">دورات المياه:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.bathrooms)} حمام</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${property.livingRooms ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الصالات:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.livingRooms)} صالة</td>` : '<td></td><td></td>'}
            ${property.floors ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عدد الأدوار:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.floors)} دور</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${property.floorNumber ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">رقم الطابق:</td><td style="padding: 6px; background: #fff;">الطابق ${toArabicNumerals(property.floorNumber)}</td>` : '<td></td><td></td>'}
            ${property.streetWidth ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عرض الشارع:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.streetWidth)} متر</td>` : '<td></td><td></td>'}
          </tr>
          <tr>
            ${property.propertyAge ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">عمر العقار:</td><td style="padding: 6px; background: #fff;">${toArabicNumerals(property.propertyAge)} سنة</td>` : '<td></td><td></td>'}
            ${property.facade ? `<td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">الواجهة:</td><td style="padding: 6px; background: #fff;">${property.facade}</td>` : '<td></td><td></td>'}
          </tr>
          ${property.furnishing ? `
          <tr>
            <td style="padding: 6px; background: #f8f9fa; font-weight: bold; color: #01411C;">التأثيث:</td>
            <td colspan="3" style="padding: 6px; background: #fff;">${property.furnishing}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- المميزات -->
      ${property.features && property.features.length > 0 ? `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          ✨ المميزات الإضافية
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${property.features.map(f => `
            <span style="background: #f0f7f2; color: #01411C; padding: 5px 10px; border-radius: 15px; font-size: 11px; border: 1px solid #D4AF37;">
              ✓ ${f}
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- الوصف الكامل -->
      ${property.aiDescription ? `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📝 وصف العقار
        </h3>
        <div style="color: #333; line-height: 1.7; text-align: justify; background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 12px;">
          ${property.aiDescription}
        </div>
      </div>
      ` : ''}

      <!-- معلومات التواصل -->
      ${includeOwner || property.brokerPhone ? `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #01411C; font-size: 14px; border-bottom: 2px solid #D4AF37; padding-bottom: 6px; margin-bottom: 10px;">
          📞 معلومات التواصل
        </h3>
        <div style="background: linear-gradient(135deg, #f0f7f2 0%, #e8f5e9 100%); padding: 15px; border-radius: 10px; border: 1px solid #D4AF37;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            ${includeOwner && property.ownerName ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #01411C; width: 30%;">👤 اسم المالك:</td>
              <td style="padding: 8px 0; color: #333;">${property.ownerName}</td>
            </tr>` : ''}
            ${includeOwner && property.ownerPhone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #01411C;">📱 رقم الجوال:</td>
              <td style="padding: 8px 0; color: #333; direction: ltr; text-align: right;">${property.ownerPhone}</td>
            </tr>` : ''}
            ${property.brokerPhone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #01411C;">🏢 الوسيط العقاري:</td>
              <td style="padding: 8px 0; color: #333; direction: ltr; text-align: right;">${property.brokerPhone}</td>
            </tr>` : ''}
            ${property.ownerEmail ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #01411C;">📧 البريد الإلكتروني:</td>
              <td style="padding: 8px 0; color: #333;">${property.ownerEmail}</td>
            </tr>` : ''}
          </table>
          
          <!-- أزرار التواصل -->
          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 15px; flex-wrap: wrap;">
            ${property.ownerPhone || property.brokerPhone ? `
            <div style="background: #25D366; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              💬 واتساب: ${property.ownerPhone || property.brokerPhone}
            </div>
            <div style="background: #01411C; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; font-weight: bold; text-align: center;">
              📞 اتصال: ${property.ownerPhone || property.brokerPhone}
            </div>
            ` : ''}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- رخصة الإعلان -->
      ${property.adLicense ? `
      <div style="background: #fff3cd; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px; border: 1px solid #ffc107;">
        <span style="color: #856404; font-size: 12px; font-weight: bold;">📋 رخصة الإعلان: ${property.adLicense}</span>
      </div>
      ` : ''}

    </div>

    <!-- تذييل الصفحة -->
    <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 12px 20px; margin-top: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; color: #D4AF37; font-size: 10px;">
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
export async function generatePropertyPDF(property: PropertyData, includeOwner: boolean = true): Promise<void> {
  // إنشاء محتوى HTML
  const container = createPDFContent(property, includeOwner);
  document.body.appendChild(container);

  // إضافة خط عربي ديناميكياً
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap';
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
          clonedContainer.style.fontFamily = "'Tajawal', 'Cairo', 'Segoe UI', Arial, sans-serif";
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
