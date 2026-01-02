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
  container.style.cssText = `
    width: 595px;
    min-height: 842px;
    padding: 0;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    background: white;
    position: absolute;
    left: -9999px;
    top: 0;
  `;

  const purposeAr = property.purpose === 'rent' || property.category === 'للإيجار' ? 'للإيجار' : 'للبيع';
  const typeAr = property.propertyType || 'عقار';

  container.innerHTML = `
    <!-- رأس الصفحة -->
    <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 25px; text-align: center;">
      <h1 style="color: #D4AF37; font-size: 28px; margin: 0 0 5px 0; font-weight: bold;">منصة وساطة العقارية</h1>
      <p style="color: #ffffff; font-size: 14px; margin: 0;">Wasata Real Estate Platform</p>
    </div>

    <!-- عنوان العرض -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
      <h2 style="color: #01411C; font-size: 22px; margin: 0;">
        عرض ${purposeAr} - ${typeAr} - ${property.area || ''}م²
      </h2>
    </div>

    <!-- المعلومات الرئيسية -->
    <div style="padding: 20px;">
      
      <!-- بطاقات المعلومات الأساسية -->
      <div style="display: flex; justify-content: space-around; margin-bottom: 25px; flex-wrap: wrap;">
        <div style="text-align: center; padding: 15px; background: #f0f7f2; border-radius: 10px; min-width: 120px; margin: 5px;">
          <div style="color: #01411C; font-size: 24px; font-weight: bold;">${property.area ? toArabicNumerals(property.area) : '-'}</div>
          <div style="color: #666; font-size: 12px;">م² المساحة</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f0f7f2; border-radius: 10px; min-width: 120px; margin: 5px;">
          <div style="color: #01411C; font-size: 24px; font-weight: bold;">${property.bedrooms ? toArabicNumerals(property.bedrooms) : '-'}</div>
          <div style="color: #666; font-size: 12px;">غرف</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f0f7f2; border-radius: 10px; min-width: 120px; margin: 5px;">
          <div style="color: #01411C; font-size: 24px; font-weight: bold;">${property.bathrooms ? toArabicNumerals(property.bathrooms) : '-'}</div>
          <div style="color: #666; font-size: 12px;">حمامات</div>
        </div>
      </div>

      <!-- السعر -->
      <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <div style="color: #D4AF37; font-size: 32px; font-weight: bold;">${property.price ? formatArabicPrice(property.price) : '-'}</div>
        <div style="color: #fff; font-size: 14px;">ريال سعودي ${property.purpose === 'rent' ? 'سنوياً' : ''}</div>
      </div>

      <!-- قسم الموقع -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #01411C; font-size: 16px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 15px;">
          📍 الموقع والعنوان
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">المدينة:</td>
            <td style="padding: 8px; background: #fff;">${property.locationDetails?.city || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">الحي:</td>
            <td style="padding: 8px; background: #fff;">${property.locationDetails?.district || '-'}</td>
          </tr>
          ${property.locationDetails?.street ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">الشارع:</td>
            <td style="padding: 8px; background: #fff;">${property.locationDetails.street}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- قسم المواصفات -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #01411C; font-size: 16px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 15px;">
          🏠 المواصفات التفصيلية
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${property.bedrooms ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">غرف النوم:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.bedrooms)} غرف</td>
          </tr>` : ''}
          ${property.bathrooms ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">دورات المياه:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.bathrooms)} حمام</td>
          </tr>` : ''}
          ${property.livingRooms ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">الصالات:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.livingRooms)} صالة</td>
          </tr>` : ''}
          ${property.floors ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">عدد الأدوار:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.floors)} دور</td>
          </tr>` : ''}
          ${property.floorNumber ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">رقم الطابق:</td>
            <td style="padding: 8px; background: #fff;">الطابق ${toArabicNumerals(property.floorNumber)}</td>
          </tr>` : ''}
          ${property.streetWidth ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">عرض الشارع:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.streetWidth)} متر</td>
          </tr>` : ''}
          ${property.propertyAge ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">عمر العقار:</td>
            <td style="padding: 8px; background: #fff;">${toArabicNumerals(property.propertyAge)} سنة</td>
          </tr>` : ''}
          ${property.facade ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">الواجهة:</td>
            <td style="padding: 8px; background: #fff;">${property.facade}</td>
          </tr>` : ''}
          ${property.furnishing ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">التأثيث:</td>
            <td style="padding: 8px; background: #fff;">${property.furnishing}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- المميزات -->
      ${property.features && property.features.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #01411C; font-size: 16px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 15px;">
          ✨ المميزات الإضافية
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${property.features.map(f => `
            <span style="background: #f0f7f2; color: #01411C; padding: 6px 12px; border-radius: 20px; font-size: 12px; border: 1px solid #D4AF37;">
              ✓ ${f}
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- الوصف -->
      ${property.aiDescription ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #01411C; font-size: 16px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 15px;">
          📝 وصف العقار
        </h3>
        <p style="color: #333; line-height: 1.8; text-align: justify; background: #f8f9fa; padding: 15px; border-radius: 8px;">
          ${property.aiDescription}
        </p>
      </div>
      ` : ''}

      <!-- معلومات التواصل -->
      ${includeOwner && (property.ownerName || property.ownerPhone) ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #01411C; font-size: 16px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; margin-bottom: 15px;">
          📞 معلومات التواصل
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${property.ownerName ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; width: 30%; font-weight: bold; color: #01411C;">اسم المالك:</td>
            <td style="padding: 8px; background: #fff;">${property.ownerName}</td>
          </tr>` : ''}
          ${property.ownerPhone ? `
          <tr>
            <td style="padding: 8px; background: #f8f9fa; font-weight: bold; color: #01411C;">رقم الجوال:</td>
            <td style="padding: 8px; background: #fff; direction: ltr; text-align: right;">${property.ownerPhone}</td>
          </tr>` : ''}
        </table>
      </div>
      ` : ''}

    </div>

    <!-- تذييل الصفحة -->
    <div style="background: linear-gradient(135deg, #01411C 0%, #024a21 100%); padding: 15px 25px; position: absolute; bottom: 0; left: 0; right: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; color: #D4AF37; font-size: 11px;">
        <span>تم إنشاءه بتاريخ: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        ${property.brokerPhone ? `<span>الوسيط: ${property.brokerPhone}</span>` : ''}
        ${property.adLicense ? `<span>رخصة الإعلان: ${property.adLicense}</span>` : ''}
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

  try {
    // تحويل HTML إلى Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // إنشاء PDF من Canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // إضافة صفحات إضافية إذا لزم الأمر
    const pageHeight = 297; // A4 height in mm
    if (imgHeight > pageHeight) {
      let remainingHeight = imgHeight - pageHeight;
      let position = -pageHeight;
      
      while (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
        position -= pageHeight;
      }
    }

    // اسم الملف بالعربية
    const purposeAr = property.purpose === 'rent' || property.category === 'للإيجار' ? 'للإيجار' : 'للبيع';
    const typeAr = property.propertyType || 'عقار';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `عرض_${purposeAr}_-_${typeAr}_-_${property.area || ''}م_${date}.pdf`;
    
    pdf.save(fileName);
  } finally {
    // تنظيف العنصر المؤقت
    document.body.removeChild(container);
  }
}
