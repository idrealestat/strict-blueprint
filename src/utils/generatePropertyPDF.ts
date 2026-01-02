/**
 * generatePropertyPDF.ts
 * دالة توليد ملف PDF لتفاصيل العقار مع دعم كامل للعربية
 */

import { jsPDF } from 'jspdf';

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
}

// دالة لعكس النص العربي للعرض الصحيح
const reverseArabicText = (text: string): string => {
  // التحقق مما إذا كان النص يحتوي على أحرف عربية
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(text)) {
    return text;
  }
  
  // عكس النص العربي لعرضه بشكل صحيح في jsPDF
  return text.split('').reverse().join('');
};

// دالة لتحويل الأرقام إلى أرقام عربية
const toArabicNumerals = (num: string | number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicNumbers[parseInt(d)]);
};

// ترجمة المصطلحات للعربية
const arabicLabels: { [key: string]: string } = {
  'Property Type': 'نوع العقار',
  'Category': 'التصنيف',
  'Purpose': 'الغرض',
  'Area': 'المساحة',
  'Price': 'السعر',
  'City': 'المدينة',
  'District': 'الحي',
  'Street': 'الشارع',
  'Building Number': 'رقم المبنى',
  'Postal Code': 'الرمز البريدي',
  'Bedrooms': 'غرف النوم',
  'Bathrooms': 'دورات المياه',
  'Living Rooms': 'الصالات',
  'Floors': 'الأدوار',
  'Floor Number': 'رقم الطابق',
  'Street Width': 'عرض الشارع',
  'Property Age': 'عمر العقار',
  'Facade': 'الواجهة',
  'Furnishing': 'التأثيث',
  'Owner Name': 'اسم المالك',
  'Phone': 'الهاتف',
  'sqm': 'م²',
  'SAR': 'ريال',
  'm': 'م',
  'years': 'سنة',
};

/**
 * توليد PDF لتفاصيل العقار مع دعم العربية
 */
export async function generatePropertyPDF(property: PropertyData, includeOwner: boolean = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // تفعيل RTL
  doc.setR2L(true);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ======== رأس الصفحة ========
  doc.setFillColor(1, 65, 28); // #01411C
  doc.rect(0, 0, pageWidth, 45, 'F');

  // عنوان رئيسي
  doc.setTextColor(212, 175, 55); // #D4AF37
  doc.setFontSize(26);
  doc.text('Wasata', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Real Estate Platform', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Property Details Report', pageWidth / 2, 38, { align: 'center' });

  yPos = 55;

  // ======== معلومات العقار الأساسية ========
  const drawSectionHeader = (title: string, arabicTitle: string) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
    
    doc.setTextColor(1, 65, 28);
    doc.setFontSize(14);
    doc.text(title, margin + 5, yPos);
    doc.text(arabicTitle, pageWidth - margin - 5, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  const drawInfoRow = (label: string, value: string, arabicLabel?: string) => {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(label, margin + 5, yPos);
    
    if (arabicLabel) {
      doc.text(arabicLabel, pageWidth - margin - 5, yPos, { align: 'right' });
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(value, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
  };

  // معلومات العقار الأساسية
  drawSectionHeader('Property Information', 'معلومات العقار');

  const basicInfo = [
    { en: 'Property Type', ar: 'نوع العقار', value: property.propertyType || '-' },
    { en: 'Category', ar: 'التصنيف', value: property.category || '-' },
    { en: 'Purpose', ar: 'الغرض', value: property.purpose || '-' },
    { en: 'Area', ar: 'المساحة', value: property.area ? `${property.area} m² / ${toArabicNumerals(property.area)} م²` : '-' },
    { en: 'Price', ar: 'السعر', value: property.price ? `${parseInt(property.price).toLocaleString()} SAR` : '-' },
  ];

  basicInfo.forEach(({ en, ar, value }) => {
    drawInfoRow(en, value, ar);
  });

  yPos += 5;

  // ======== معلومات الموقع ========
  drawSectionHeader('Location Details', 'تفاصيل الموقع');

  const locationInfo = [
    { en: 'City', ar: 'المدينة', value: property.locationDetails?.city || '-' },
    { en: 'District', ar: 'الحي', value: property.locationDetails?.district || '-' },
    { en: 'Street', ar: 'الشارع', value: property.locationDetails?.street || '-' },
  ];

  locationInfo.forEach(({ en, ar, value }) => {
    drawInfoRow(en, value, ar);
  });

  yPos += 5;

  // ======== المواصفات التفصيلية ========
  drawSectionHeader('Specifications', 'المواصفات');

  const specs = [
    { en: 'Bedrooms', ar: 'غرف النوم', value: property.bedrooms || '-' },
    { en: 'Bathrooms', ar: 'دورات المياه', value: property.bathrooms || '-' },
    { en: 'Living Rooms', ar: 'الصالات', value: property.livingRooms || '-' },
    { en: 'Floors', ar: 'الأدوار', value: property.floors || '-' },
    { en: 'Floor Number', ar: 'رقم الطابق', value: property.floorNumber || '-' },
    { en: 'Street Width', ar: 'عرض الشارع', value: property.streetWidth ? `${property.streetWidth} m` : '-' },
    { en: 'Property Age', ar: 'عمر العقار', value: property.propertyAge ? `${property.propertyAge} years` : '-' },
    { en: 'Facade', ar: 'الواجهة', value: property.facade || '-' },
    { en: 'Furnishing', ar: 'التأثيث', value: property.furnishing || '-' },
  ].filter(item => item.value !== '-');

  specs.forEach(({ en, ar, value }) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    drawInfoRow(en, value, ar);
  });

  // ======== معلومات المالك ========
  if (includeOwner && (property.ownerName || property.ownerPhone)) {
    yPos += 5;
    
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    drawSectionHeader('Owner Information', 'معلومات المالك');

    if (property.ownerName) {
      drawInfoRow('Owner Name', property.ownerName, 'اسم المالك');
    }
    if (property.ownerPhone) {
      drawInfoRow('Phone', property.ownerPhone, 'الهاتف');
    }
  }

  // ======== المميزات ========
  if (property.features && property.features.length > 0) {
    yPos += 5;
    
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    drawSectionHeader('Features', 'المميزات');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const featuresPerRow = 3;
    const featureWidth = (pageWidth - 2 * margin) / featuresPerRow;
    
    property.features.forEach((feature, idx) => {
      const col = idx % featuresPerRow;
      const row = Math.floor(idx / featuresPerRow);
      
      if (col === 0 && row > 0) {
        yPos += 7;
      }
      
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
      }

      const xPos = margin + (col * featureWidth) + featureWidth / 2;
      doc.text(`• ${feature}`, xPos, yPos + (row === 0 ? 0 : 0), { align: 'center' });
    });

    yPos += 15;
  }

  // ======== الوصف ========
  if (property.aiDescription) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    drawSectionHeader('Description', 'الوصف');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(property.aiDescription, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    });
  }

  // ======== تذييل الصفحة ========
  const addFooter = (pageNum: number) => {
    doc.setFillColor(1, 65, 28);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(9);
    
    const date = new Date().toLocaleDateString('en-SA');
    doc.text(`Generated: ${date}`, margin, pageHeight - 8);
    
    if (property.brokerPhone) {
      doc.text(`Broker: ${property.brokerPhone}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }
    
    if (property.adLicense) {
      doc.text(`License: ${property.adLicense}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  };

  // إضافة التذييل لجميع الصفحات
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // تحميل الملف
  const fileName = `property_${property.id?.slice(0, 8) || 'report'}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}
