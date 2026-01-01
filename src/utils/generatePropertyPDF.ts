/**
 * generatePropertyPDF.ts
 * دالة توليد ملف PDF لتفاصيل العقار
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

/**
 * توليد PDF لتفاصيل العقار
 */
export async function generatePropertyPDF(property: PropertyData, includeOwner: boolean = true): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // إعداد الخط العربي - استخدام الخط الافتراضي مع RTL
  doc.setR2L(true);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ======== رأس الصفحة ========
  // خلفية الرأس
  doc.setFillColor(1, 65, 28); // #01411C
  doc.rect(0, 0, pageWidth, 40, 'F');

  // عنوان رئيسي
  doc.setTextColor(212, 175, 55); // #D4AF37
  doc.setFontSize(24);
  doc.text('Wasata Real Estate', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Property Details Report', pageWidth / 2, 30, { align: 'center' });

  yPos = 50;

  // ======== معلومات العقار الأساسية ========
  doc.setTextColor(1, 65, 28);
  doc.setFontSize(16);
  doc.text('Property Information', margin, yPos);
  
  yPos += 5;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  // جدول المعلومات الأساسية
  const basicInfo = [
    ['Property Type', property.propertyType || '-'],
    ['Category', property.category || '-'],
    ['Purpose', property.purpose || '-'],
    ['Area', property.area ? `${property.area} sqm` : '-'],
    ['Price', property.price ? `${parseInt(property.price).toLocaleString()} SAR` : '-'],
  ];

  basicInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(value, pageWidth - margin - 50, yPos, { align: 'right' });
    yPos += 7;
  });

  yPos += 5;

  // ======== معلومات الموقع ========
  doc.setTextColor(1, 65, 28);
  doc.setFontSize(16);
  doc.text('Location Details', margin, yPos);
  
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const locationInfo = [
    ['City', property.locationDetails?.city || '-'],
    ['District', property.locationDetails?.district || '-'],
    ['Street', property.locationDetails?.street || '-'],
    ['Building Number', property.locationDetails?.buildingNumber || '-'],
    ['Postal Code', property.locationDetails?.postalCode || '-'],
  ];

  locationInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(value, pageWidth - margin - 50, yPos, { align: 'right' });
    yPos += 7;
  });

  yPos += 5;

  // ======== المواصفات التفصيلية ========
  doc.setTextColor(1, 65, 28);
  doc.setFontSize(16);
  doc.text('Specifications', margin, yPos);
  
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const specs = [
    ['Bedrooms', property.bedrooms || '-'],
    ['Bathrooms', property.bathrooms || '-'],
    ['Living Rooms', property.livingRooms || '-'],
    ['Floors', property.floors || '-'],
    ['Floor Number', property.floorNumber || '-'],
    ['Street Width', property.streetWidth ? `${property.streetWidth} m` : '-'],
    ['Property Age', property.propertyAge ? `${property.propertyAge} years` : '-'],
    ['Facade', property.facade || '-'],
    ['Furnishing', property.furnishing || '-'],
  ].filter(([_, value]) => value !== '-');

  specs.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(value, pageWidth - margin - 50, yPos, { align: 'right' });
    yPos += 7;
  });

  // التحقق من الحاجة لصفحة جديدة
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  yPos += 5;

  // ======== معلومات المالك ========
  if (includeOwner && (property.ownerName || property.ownerPhone)) {
    doc.setTextColor(1, 65, 28);
    doc.setFontSize(16);
    doc.text('Owner Information', margin, yPos);
    
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    const ownerInfo = [
      ['Owner Name', property.ownerName || '-'],
      ['Phone', property.ownerPhone || '-'],
    ];

    ownerInfo.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(`${label}:`, pageWidth - margin, yPos, { align: 'right' });
      doc.setFont(undefined, 'normal');
      doc.text(value, pageWidth - margin - 50, yPos, { align: 'right' });
      yPos += 7;
    });

    yPos += 5;
  }

  // ======== المميزات ========
  if (property.features && property.features.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(1, 65, 28);
    doc.setFontSize(16);
    doc.text('Features', margin, yPos);
    
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // عرض المميزات في صفين
    const featuresPerRow = 3;
    const featureWidth = (pageWidth - 2 * margin) / featuresPerRow;
    
    property.features.forEach((feature, idx) => {
      const col = idx % featuresPerRow;
      const row = Math.floor(idx / featuresPerRow);
      
      if (col === 0 && row > 0) {
        yPos += 7;
      }
      
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      const xPos = pageWidth - margin - (col * featureWidth) - featureWidth / 2;
      doc.text(`• ${feature}`, xPos, yPos + (row === 0 ? 0 : 0), { align: 'center' });
    });

    yPos += 15;
  }

  // ======== الوصف ========
  if (property.aiDescription) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(1, 65, 28);
    doc.setFontSize(16);
    doc.text('Description', margin, yPos);
    
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    // تقسيم النص الطويل
    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(property.aiDescription, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    });
  }

  // ======== تذييل الصفحة ========
  const addFooter = (pageNum: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    
    const date = new Date().toLocaleDateString('en-SA');
    doc.text(`Generated on: ${date}`, margin, pageHeight - 10);
    
    if (property.brokerPhone) {
      doc.text(`Broker: ${property.brokerPhone}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    if (property.adLicense) {
      doc.text(`License: ${property.adLicense}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
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
