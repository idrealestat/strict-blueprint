/**
 * OfficialBusinessCard.tsx
 * البطاقة الرسمية القابلة للطباعة - وجهين (أمامي/خلفي)
 */

import React, { useState, useRef } from 'react';
import { Download, FileText, Printer, Edit2, Phone, Mail, MapPin, Star, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useBusinessCardData } from '@/hooks/useBusinessCardData';
import { getIdentityImage, getAvatarFallback, generateVCard, defaultDisplayOptions } from '@/types/businessCard';
import { useQRCode } from '@/hooks/useQRCode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';
import saudiWatermark from '@/assets/saudi-handshake-watermark.png';

// Wasata AI Logo as SVG watermark - positioned lower and bigger
const WasataWatermark = () => (
  <div className="absolute inset-0 flex items-end justify-center pb-16 opacity-[0.04] pointer-events-none">
    <svg viewBox="0 0 200 200" className="w-56 h-56">
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="bold" fill="currentColor">
        وساطة AI
      </text>
    </svg>
  </div>
);

// Saudi Watermark Background for Front Side - positioned much lower
const SaudiWatermarkBg = () => (
  <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none overflow-hidden" style={{ bottom: '-20px' }}>
    <img 
      src={saudiWatermark} 
      alt="" 
      className="w-80 h-60 object-contain opacity-[0.12]"
    />
  </div>
);

// QR Code Component for the card
const CardQRCode = ({ vCardData }: { vCardData: string }) => {
  const { qrDataUrl, loading } = useQRCode(vCardData, {
    width: 200,
    margin: 1,
    color: {
      dark: '#01411C',
      light: '#FFFFFF',
    }
  });

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="w-4 h-4 border-2 border-[#01411C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
        QR
      </div>
    );
  }

  return <img src={qrDataUrl} alt="QR Code - vCard" className="w-full h-full" />;
};

interface OfficialBusinessCardProps {
  onEdit?: () => void;
}

export default function OfficialBusinessCard({ onEdit }: OfficialBusinessCardProps) {
  const { data, loading } = useBusinessCardData();
  const [isFlipped, setIsFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const identityImage = getIdentityImage(data);
  const avatarFallback = getAvatarFallback(data.name);
  const publicUrl = `wasataai.com/${data.slug}`;
  const vCardData = generateVCard(data);
  
  // Get display options with defaults
  const displayOptions = data.displayOptions || defaultDisplayOptions;

  // Handle image download - Fixed for back side transform
  const handleDownloadImage = async () => {
    if (!frontRef.current || !backRef.current) return;
    
    try {
      toast.loading('جاري تحضير الصور...');
      
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      };
      
      // Capture front
      const frontCanvas = await html2canvas(frontRef.current, canvasOptions);
      const frontLink = document.createElement('a');
      frontLink.download = `${data.name}_front.png`;
      frontLink.href = frontCanvas.toDataURL('image/png');
      frontLink.click();

      // Capture back - temporarily remove transform
      const backElement = backRef.current;
      const originalTransform = backElement.style.transform;
      backElement.style.transform = 'none';
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const backCanvas = await html2canvas(backElement, {
        ...canvasOptions,
        backgroundColor: null,
      });
      const backLink = document.createElement('a');
      backLink.download = `${data.name}_back.png`;
      backLink.href = backCanvas.toDataURL('image/png');
      backLink.click();
      
      // Restore transform
      backElement.style.transform = originalTransform;

      toast.dismiss();
      toast.success('تم تحميل الصور بنجاح!');
    } catch (error) {
      console.error('Image download error:', error);
      toast.dismiss();
      toast.error('حدث خطأ أثناء التحميل');
      
      // Restore transform in case of error
      if (backRef.current) {
        backRef.current.style.transform = 'rotateY(180deg)';
      }
    }
  };

  // Handle PDF download - Fixed for RTL content and back side transform (Mobile-compatible)
  const handleDownloadPDF = async () => {
    if (!frontRef.current || !backRef.current) return;
    
    try {
      toast.loading('جاري تحضير PDF...');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [90, 55] // Business card size
      });

      // Configuration for html2canvas - Enhanced for mobile compatibility
      const canvasOptions = {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        // Force LTR rendering direction to prevent mirroring on mobile
        onclone: (clonedDoc: Document, element: HTMLElement) => {
          // Ensure no transforms are applied that could cause mirroring
          element.style.transform = 'none';
          element.style.webkitTransform = 'none';
        }
      };

      // Front page - capture as-is
      const frontCanvas = await html2canvas(frontRef.current, canvasOptions);
      const frontImgData = frontCanvas.toDataURL('image/png');
      pdf.addImage(frontImgData, 'PNG', 0, 0, 90, 55);

      // Back page - Create a clone to avoid transform issues on mobile
      const backElement = backRef.current;
      
      // Store original styles
      const originalTransform = backElement.style.transform;
      const originalWebkitTransform = backElement.style.webkitTransform;
      
      // Remove ALL transforms - critical for mobile Safari/Chrome
      backElement.style.transform = 'none';
      backElement.style.webkitTransform = 'none';
      
      // Force reflow to ensure styles are applied
      backElement.offsetHeight;
      
      // Longer delay for mobile browsers to process the style change
      await new Promise(resolve => setTimeout(resolve, 150));
      
      pdf.addPage([90, 55], 'landscape');
      const backCanvas = await html2canvas(backElement, {
        ...canvasOptions,
        backgroundColor: null, // Keep gradient background
        onclone: (clonedDoc: Document, element: HTMLElement) => {
          // Double-ensure no transforms in the cloned element
          element.style.transform = 'none';
          element.style.webkitTransform = 'none';
          // Ensure RTL direction is preserved for text
          element.style.direction = 'rtl';
          // Find all child elements and remove any transforms
          const allChildren = element.querySelectorAll('*');
          allChildren.forEach((child: Element) => {
            if (child instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(child);
              if (computedStyle.transform !== 'none') {
                child.style.transform = 'none';
                child.style.webkitTransform = 'none';
              }
            }
          });
        }
      });
      const backImgData = backCanvas.toDataURL('image/png');
      pdf.addImage(backImgData, 'PNG', 0, 0, 90, 55);
      
      // Restore the original transform
      backElement.style.transform = originalTransform;
      backElement.style.webkitTransform = originalWebkitTransform;

      pdf.save(`${data.name}_business_card.pdf`);
      
      toast.dismiss();
      toast.success('تم تحميل PDF بنجاح!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss();
      toast.error('حدث خطأ أثناء التحميل');
      
      // Restore transform in case of error
      if (backRef.current) {
        backRef.current.style.transform = 'rotateY(180deg)';
        backRef.current.style.webkitTransform = 'rotateY(180deg)';
      }
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة');
      return;
    }

    // Sanitize all HTML/text injected into the print window to prevent XSS.
    const safeName = DOMPurify.sanitize(data.name || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const frontHtml = DOMPurify.sanitize(frontRef.current?.outerHTML || '', {
      ALLOWED_TAGS: ['div', 'span', 'img', 'p', 'h1', 'h2', 'h3', 'h4', 'svg', 'path', 'g', 'text', 'a', 'br', 'strong', 'em', 'small', 'ul', 'li'],
      ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height', 'viewBox', 'd', 'fill', 'stroke', 'href', 'dir'],
    });
    const backHtml = DOMPurify.sanitize(backRef.current?.outerHTML || '', {
      ALLOWED_TAGS: ['div', 'span', 'img', 'p', 'h1', 'h2', 'h3', 'h4', 'svg', 'path', 'g', 'text', 'a', 'br', 'strong', 'em', 'small', 'ul', 'li'],
      ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height', 'viewBox', 'd', 'fill', 'stroke', 'href', 'dir'],
    });

    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html dir="rtl"><head><title></title><style>
      @page { size: 90mm 55mm; margin: 0; }
      body { margin: 0; padding: 0; }
      .card { width: 90mm; height: 55mm; page-break-after: always; }
      .card:last-child { page-break-after: auto; }
    </style></head><body><div class="card" id="__front"></div><div class="card" id="__back"></div></body></html>`);
    doc.close();
    // Set title via textContent and inject sanitized HTML safely.
    doc.title = `بطاقة الأعمال - ${safeName}`;
    const frontEl = doc.getElementById('__front');
    const backEl = doc.getElementById('__back');
    if (frontEl) frontEl.innerHTML = frontHtml;
    if (backEl) backEl.innerHTML = backHtml;
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Get the job title from display options or fallback
  const jobTitle = displayOptions.showJobTitle 
    ? (displayOptions.jobTitle || data.title || 'وسيط عقاري معتمد')
    : null;
  
  // Get phone numbers based on display options
  const phoneToShow = displayOptions.showPhone ? data.phone : null;
  const whatsappToShow = displayOptions.showWhatsapp 
    ? (displayOptions.whatsappNumber || data.phone)
    : null;

  // Location display
  const locationText = [
    displayOptions.showCity && data.city,
    displayOptions.showDistrict && data.district
  ].filter(Boolean).join(' - ');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handleDownloadImage(); }}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          تحميل صورة
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handleDownloadPDF(); }}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          تحميل PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handlePrint(); }}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          طباعة
        </Button>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            تحرير
          </Button>
        )}
      </div>

      {/* Flip Card Container - Responsive Size */}
      <div 
        className="relative mx-auto cursor-pointer perspective-1000 w-full max-w-[400px]"
        style={{ aspectRatio: '400/240' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div 
            ref={frontRef}
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Card className="w-full h-full bg-white border-4 border-[#D4AF37] rounded-xl overflow-hidden shadow-2xl relative">
              {/* Saudi Watermark Background - Front Only - Lower and Bigger */}
              <SaudiWatermarkBg />
              
              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                {/* Top Section - Profile & Info */}
                <div className="flex items-start gap-3">
                  {/* Identity Image */}
                  <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#D4AF37] flex items-center justify-center shadow-lg">
                    {identityImage ? (
                      <img src={identityImage} alt={data.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#01411C] text-xl font-bold">{avatarFallback}</span>
                    )}
                  </div>
                  
                  {/* Name & Title */}
                  <div className="flex-1">
                    {/* For company/office accounts: Company name first (large), then user name (small) */}
                    {(data.identityMode === 'logo' || displayOptions.primaryDisplayName === 'company') && data.companyName ? (
                      <>
                        <h2 className="text-[#01411C] font-bold text-lg leading-tight">{data.companyName}</h2>
                        <p className="text-[#01411C]/70 text-xs">{data.name}</p>
                        {displayOptions.showNameEnglish && displayOptions.nameEnglish && (
                          <p className="text-[#01411C]/60 text-xs">{displayOptions.nameEnglish}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <h2 className="text-[#01411C] font-bold text-lg leading-tight">{data.name}</h2>
                        {displayOptions.showNameEnglish && displayOptions.nameEnglish && (
                          <p className="text-[#01411C]/70 text-xs">{displayOptions.nameEnglish}</p>
                        )}
                        {data.companyName && (
                          <p className="text-[#01411C]/70 text-xs">{data.companyName}</p>
                        )}
                      </>
                    )}
                    {jobTitle && (
                      <p className="text-[#D4AF37] text-sm">{jobTitle}</p>
                    )}
                    {/* Rating */}
                    {displayOptions.showRating && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i <= Math.floor(data.rating) ? 'text-[#D4AF37] fill-current' : 'text-[#01411C]/30'}`}
                          />
                        ))}
                        <span className="text-[#D4AF37] text-xs mr-1">{data.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code - Top Right, Bigger */}
                  <div className="w-20 h-20 bg-white rounded-lg p-1 shadow-lg overflow-hidden border border-[#D4AF37]/30">
                    <CardQRCode vCardData={vCardData} />
                  </div>
                </div>

                {/* Bottom Section - Contact Info */}
                <div className="space-y-1.5 mt-2">
                  {phoneToShow && (
                    <div className="flex items-center gap-2 text-[#01411C] text-xs">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span dir="ltr">{phoneToShow}</span>
                      {whatsappToShow && whatsappToShow !== phoneToShow && (
                        <>
                          <span className="text-[#D4AF37]">•</span>
                          <MessageCircle className="w-3 h-3 text-green-600" />
                          <span dir="ltr">{whatsappToShow}</span>
                        </>
                      )}
                    </div>
                  )}
                  {!phoneToShow && whatsappToShow && (
                    <div className="flex items-center gap-2 text-[#01411C] text-xs">
                      <MessageCircle className="w-3 h-3 text-green-600" />
                      <span dir="ltr">{whatsappToShow}</span>
                    </div>
                  )}
                  {displayOptions.showEmail && data.email && (
                    <div className="flex items-center gap-2 text-[#01411C] text-xs">
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      <span>{data.email}</span>
                    </div>
                  )}
                  {locationText && (
                    <div className="flex items-center gap-2 text-[#01411C] text-xs">
                      <MapPin className="w-3 h-3 text-[#D4AF37]" />
                      <span>{locationText}</span>
                    </div>
                  )}
                  {/* Public URL */}
                  <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-medium">
                    <Globe className="w-3 h-3" />
                    <span dir="ltr">{publicUrl}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Back Side */}
          <div 
            ref={backRef}
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <Card className="w-full h-full bg-gradient-to-br from-[#01411C] via-[#065f41] to-[#01411C] border-4 border-[#D4AF37] rounded-xl overflow-hidden shadow-2xl">
              <WasataWatermark />
              
              <div className="relative z-10 p-4 h-full flex flex-col items-center justify-between text-center">
                {/* Top Section - Logo, Name, Company */}
                <div className="flex flex-col items-center pt-2">
                  {/* Identity Image/Logo */}
                  <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37] overflow-hidden bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 mb-2 ring-2 ring-[#D4AF37]/50 ring-offset-2 ring-offset-[#01411C]">
                    {identityImage ? (
                      <img src={identityImage} alt={data.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#01411C] text-2xl font-bold">{avatarFallback}</span>
                    )}
                  </div>

                  {/* Broker Name */}
                  <h2 className="text-white font-bold text-sm">{data.name}</h2>
                  {displayOptions.showNameEnglish && displayOptions.nameEnglish && (
                    <p className="text-white/70 text-[10px]">{displayOptions.nameEnglish}</p>
                  )}
                  
                  {/* Company/Platform Name */}
                  <p className="text-[#D4AF37] text-xs">
                    {data.companyName || jobTitle || 'وسيط عقاري معتمد'}
                  </p>
                </div>

                {/* Middle Section - Domain & Phone */}
                <div className="flex flex-col items-center gap-2">
                  {/* Platform Link */}
                  <div className="bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm border border-[#D4AF37]/30">
                    <div className="flex items-center gap-1 text-[#D4AF37] text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      <span dir="ltr">{publicUrl}</span>
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div className="flex items-center gap-2 text-white text-xs">
                    {phoneToShow && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#D4AF37]" />
                        <span dir="ltr">{phoneToShow}</span>
                      </div>
                    )}
                    {whatsappToShow && whatsappToShow !== phoneToShow && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-green-400" />
                        <span dir="ltr">{whatsappToShow}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom - Wasata Branding */}
                <p className="text-white/60 text-[10px] pb-1">منصة الوساطة الذكية للعقارات</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Flip Indicator */}
      <p className="text-center text-sm text-muted-foreground">
        اضغط على البطاقة للتقليب • {isFlipped ? 'الخلف' : 'الأمام'}
      </p>
    </div>
  );
}
